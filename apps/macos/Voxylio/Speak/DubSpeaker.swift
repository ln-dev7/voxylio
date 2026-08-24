// Proof P4 — the dubbed voice. AVSpeechSynthesizer with the engine's
// pacing (VoxylioKit.computeUtteranceRate): gentle catch-up, capped, in
// sync with the segment duration.

import AVFoundation
import Foundation
import VoxylioKit

final class DubSpeaker: NSObject, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()
    private var finishContinuation: CheckedContinuation<Void, Never>?

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    static func voices(for language: String) -> [AVSpeechSynthesisVoice] {
        AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.lowercased().hasPrefix(language.lowercased()) }
            .sorted { $0.name < $1.name }
    }

    var isSpeaking: Bool { synthesizer.isSpeaking }

    /// Speaks one line and returns when it finished (or was cancelled).
    func speak(
        _ text: String,
        language: String,
        voiceIdentifier: String?,
        segmentDuration: Double,
        baseRate: Double
    ) async {
        let engineRate = computeUtteranceRate(
            text: text, cueDur: segmentDuration, baseRate: baseRate, playbackRate: 1)
        let utterance = AVSpeechUtterance(string: text)
        if let id = voiceIdentifier, let voice = AVSpeechSynthesisVoice(identifier: id) {
            utterance.voice = voice
        } else {
            utterance.voice = AVSpeechSynthesisVoice(language: language)
        }
        // Engine rate ≈ 1.0–1.45 multiplier; AVSpeech's neutral is 0.5.
        let mapped = Float(engineRate) * AVSpeechUtteranceDefaultSpeechRate
        utterance.rate = min(
            max(mapped, AVSpeechUtteranceMinimumSpeechRate),
            AVSpeechUtteranceMaximumSpeechRate)

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            finishContinuation = cont
            synthesizer.speak(utterance)
        }
    }

    func cancel() {
        synthesizer.stopSpeaking(at: .immediate)
    }

    // MARK: AVSpeechSynthesizerDelegate

    func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance
    ) {
        finishContinuation?.resume()
        finishContinuation = nil
    }

    func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance
    ) {
        finishContinuation?.resume()
        finishContinuation = nil
    }
}
