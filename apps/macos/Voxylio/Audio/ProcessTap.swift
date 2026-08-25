// Proof P1 — per-app audio capture via a Core Audio process tap
// (macOS 14.2+). The tap MUTES the source app (muteBehavior
// .mutedWhenTapped): Voxylio replays the original itself at the chosen
// "original volume", which is what makes true ducking possible (P4).
//
// Teardown is defensive: every resource (IOProc, aggregate device, tap)
// is destroyed in stop(), and stop() is idempotent — the mute dies with
// the tap, so a crash can never leave the app silent.

import AVFoundation
import AudioToolbox
import CoreAudio
import Foundation

final class ProcessTap {
    private let target: AudioAppInfo.Target
    private var tapID = AudioObjectID(kAudioObjectUnknown)
    private var aggregateID = AudioObjectID(kAudioObjectUnknown)
    private var ioProcID: AudioDeviceIOProcID?
    private(set) var format: AVAudioFormat?
    private var handler: ((AVAudioPCMBuffer) -> Void)?
    private(set) var buffersDelivered = 0

    init(target: AudioAppInfo.Target) {
        self.target = target
    }

    func start(bufferHandler: @escaping (AVAudioPCMBuffer) -> Void) throws {
        handler = bufferHandler

        // 1. The tap itself. Per-app: stereo mixdown of the app AND its
        //    helper processes (Chrome/Safari play audio in helpers).
        //    System-wide: everything EXCEPT Voxylio itself, so the
        //    passthrough + dub can never feed back into the capture.
        let description: CATapDescription
        switch target {
        case .processes(let objects):
            guard !objects.isEmpty else {
                throw TapError.osStatus("empty process list", -1)
            }
            description = CATapDescription(stereoMixdownOfProcesses: objects)
        case .systemWide:
            let own = AudioProcessList.ownProcessObject().map { [$0] } ?? []
            description = CATapDescription(
                stereoGlobalTapButExcludeProcesses: own)
        }
        description.uuid = UUID()
        description.muteBehavior = .mutedWhenTapped
        description.isPrivate = true
        var newTapID = AudioObjectID(kAudioObjectUnknown)
        var err = AudioHardwareCreateProcessTap(description, &newTapID)
        guard err == noErr else { throw TapError.osStatus("AudioHardwareCreateProcessTap", err) }
        tapID = newTapID

        // 2. Its stream format (what the IOProc will deliver).
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioTapPropertyFormat,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var asbd = AudioStreamBasicDescription()
        var size = UInt32(MemoryLayout<AudioStreamBasicDescription>.size)
        err = AudioObjectGetPropertyData(tapID, &address, 0, nil, &size, &asbd)
        guard err == noErr, let fmt = AVAudioFormat(streamDescription: &asbd) else {
            stop()
            throw TapError.osStatus("kAudioTapPropertyFormat", err)
        }
        format = fmt

        // 3. A private aggregate device wrapping the tap.
        let aggregateUID = UUID().uuidString
        let descriptionDict: [String: Any] = [
            kAudioAggregateDeviceNameKey as String: "Voxylio Tap",
            kAudioAggregateDeviceUIDKey as String: aggregateUID,
            kAudioAggregateDeviceIsPrivateKey as String: 1,
            kAudioAggregateDeviceIsStackedKey as String: 0,
            kAudioAggregateDeviceTapAutoStartKey as String: 1,
            kAudioAggregateDeviceSubDeviceListKey as String: [Any](),
            kAudioAggregateDeviceTapListKey as String: [
                [kAudioSubTapUIDKey as String: description.uuid.uuidString]
            ],
        ]
        var newAggregateID = AudioObjectID(kAudioObjectUnknown)
        err = AudioHardwareCreateAggregateDevice(descriptionDict as CFDictionary, &newAggregateID)
        guard err == noErr else {
            stop()
            throw TapError.osStatus("AudioHardwareCreateAggregateDevice", err)
        }
        aggregateID = newAggregateID

        // 4. Pull buffers from the aggregate device.
        err = AudioDeviceCreateIOProcIDWithBlock(&ioProcID, aggregateID, nil) {
            [weak self] _, inInputData, _, _, _ in
            guard let self, let fmt = self.format, let handler = self.handler else { return }
            let abl = UnsafeMutableAudioBufferListPointer(
                UnsafeMutablePointer(mutating: inInputData))
            guard abl.count > 0 else { return }
            let bytesPerFrame = fmt.streamDescription.pointee.mBytesPerFrame
            guard bytesPerFrame > 0 else { return }
            let frames = AVAudioFrameCount(abl[0].mDataByteSize / bytesPerFrame)
            guard frames > 0,
                let pcm = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: frames)
            else { return }
            pcm.frameLength = frames
            // Manual deep copy: IOProc buffers are only valid inside the
            // callback, and layouts must match exactly.
            let dst = UnsafeMutableAudioBufferListPointer(pcm.mutableAudioBufferList)
            for i in 0..<min(abl.count, dst.count) {
                if let from = abl[i].mData, let to = dst[i].mData {
                    memcpy(to, from, Int(min(abl[i].mDataByteSize, dst[i].mDataByteSize)))
                }
            }
            self.buffersDelivered += 1
            handler(pcm)
        }
        guard err == noErr else {
            stop()
            throw TapError.osStatus("AudioDeviceCreateIOProcIDWithBlock", err)
        }
        err = AudioDeviceStart(aggregateID, ioProcID)
        guard err == noErr else {
            stop()
            throw TapError.osStatus("AudioDeviceStart", err)
        }
    }

    func stop() {
        if let ioProcID, aggregateID != kAudioObjectUnknown {
            AudioDeviceStop(aggregateID, ioProcID)
            AudioDeviceDestroyIOProcID(aggregateID, ioProcID)
        }
        ioProcID = nil
        if aggregateID != kAudioObjectUnknown {
            AudioHardwareDestroyAggregateDevice(aggregateID)
            aggregateID = AudioObjectID(kAudioObjectUnknown)
        }
        if tapID != kAudioObjectUnknown {
            AudioHardwareDestroyProcessTap(tapID)
            tapID = AudioObjectID(kAudioObjectUnknown)
        }
        handler = nil
    }

    deinit { stop() }

    enum TapError: LocalizedError {
        case osStatus(String, OSStatus)
        var errorDescription: String? {
            switch self {
            case .osStatus(let call, let code):
                return "\(call) failed (\(code)) — is System Audio Recording allowed for Voxylio?"
            }
        }
    }
}
