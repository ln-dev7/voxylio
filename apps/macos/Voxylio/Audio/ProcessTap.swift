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
    private let processObjectID: AudioObjectID
    private var tapID = AudioObjectID(kAudioObjectUnknown)
    private var aggregateID = AudioObjectID(kAudioObjectUnknown)
    private var ioProcID: AudioDeviceIOProcID?
    private(set) var format: AVAudioFormat?
    private var handler: ((AVAudioPCMBuffer) -> Void)?
    private(set) var buffersDelivered = 0

    init(processObjectID: AudioObjectID) {
        self.processObjectID = processObjectID
    }

    func start(bufferHandler: @escaping (AVAudioPCMBuffer) -> Void) throws {
        handler = bufferHandler

        // 1. The tap itself — stereo mixdown of the chosen process only.
        let description = CATapDescription(stereoMixdownOfProcesses: [processObjectID])
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
            let ablPointer = UnsafeMutableAudioBufferListPointer(
                UnsafeMutablePointer(mutating: inInputData))
            guard ablPointer.count > 0 else { return }
            let frames = ablPointer[0].mDataByteSize
                / UInt32(fmt.streamDescription.pointee.mBytesPerFrame)
            guard frames > 0,
                let pcm = AVAudioPCMBuffer(
                    pcmFormat: fmt, bufferListNoCopy: inInputData, deallocator: nil)?.copySelf()
            else { return }
            _ = frames
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

extension AVAudioPCMBuffer {
    /// Deep copy: buffers handed to an IOProc are only valid inside it.
    func copySelf() -> AVAudioPCMBuffer? {
        guard
            let copy = AVAudioPCMBuffer(
                pcmFormat: format, frameCapacity: frameLength)
        else { return nil }
        copy.frameLength = frameLength
        let src = audioBufferList.pointee
        let dst = copy.mutableAudioBufferList.pointee
        withUnsafePointer(to: src) { s in
            withUnsafePointer(to: dst) { d in
                let sList = UnsafeMutableAudioBufferListPointer(
                    UnsafeMutablePointer(mutating: s))
                let dList = UnsafeMutableAudioBufferListPointer(
                    UnsafeMutablePointer(mutating: d))
                for i in 0..<min(sList.count, dList.count) {
                    if let from = sList[i].mData, let to = dList[i].mData {
                        memcpy(to, from, Int(sList[i].mDataByteSize))
                    }
                }
            }
        }
        return copy
    }
}
