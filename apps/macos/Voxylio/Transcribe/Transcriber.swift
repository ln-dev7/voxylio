// Proof P2 — streaming transcription of the tapped audio with
// SFSpeechRecognizer (on-device when the locale supports it). Emits
// evolving partials + finals; sentence assembly happens in the
// orchestrator with VoxylioKit (same rollup logic as the extension).
//
// SFSpeechRecognizer limits sessions to ~1 minute: the transcriber
// restarts its task on every final result and on a safety timer.

import AVFoundation
import Foundation
import Speech

struct TranscriptEvent {
    let text: String
    let isFinal: Bool
    let timestamp: TimeInterval // seconds since capture start
}

final class Transcriber: NSObject {
    private let recognizer: SFSpeechRecognizer
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var handler: ((TranscriptEvent) -> Void)?
    private let startDate = Date()
    private var restartTimer: Timer?
    private(set) var usesOnDevice = false
    /// Median-latency probe for the proofs screen.
    private(set) var lastFinalLatency: TimeInterval = 0
    private var lastAudioAt = Date()

    init?(locale: Locale) {
        guard let r = SFSpeechRecognizer(locale: locale), r.isAvailable else { return nil }
        recognizer = r
        super.init()
    }

    static func requestAuthorization() async -> Bool {
        await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { status in
                cont.resume(returning: status == .authorized)
            }
        }
    }

    func start(onEvent: @escaping (TranscriptEvent) -> Void) {
        handler = onEvent
        usesOnDevice = recognizer.supportsOnDeviceRecognition
        beginTask()
        // Safety restart well under the platform's session limit.
        restartTimer = Timer.scheduledTimer(withTimeInterval: 50, repeats: true) { [weak self] _ in
            self?.rotateTask()
        }
    }

    private func beginTask() {
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        req.requiresOnDeviceRecognition = usesOnDevice
        req.taskHint = .dictation
        request = req
        task = recognizer.recognitionTask(with: req) { [weak self] result, error in
            guard let self else { return }
            if let result {
                let text = result.bestTranscription.formattedString
                let event = TranscriptEvent(
                    text: text,
                    isFinal: result.isFinal,
                    timestamp: Date().timeIntervalSince(self.startDate)
                )
                if result.isFinal {
                    self.lastFinalLatency = Date().timeIntervalSince(self.lastAudioAt)
                }
                self.handler?(event)
                if result.isFinal {
                    // Keep the stream going: next utterance, fresh task.
                    self.rotateTask()
                }
            } else if error != nil {
                // Recognition hiccup: restart quietly, capture continues.
                self.rotateTask()
            }
        }
    }

    private func rotateTask() {
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        beginTask()
    }

    func append(_ buffer: AVAudioPCMBuffer) {
        lastAudioAt = Date()
        request?.append(buffer)
    }

    func stop() {
        restartTimer?.invalidate()
        restartTimer = nil
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        handler = nil
    }
}
