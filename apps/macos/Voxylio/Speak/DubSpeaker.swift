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
            // Safety net: if the synthesizer never calls back (bad voice,
            // audio route change…), cut and move on — the pipeline must
            // never wait forever on one line.
            let cap = min(20.0, 3.0 + Double(text.count) / 8.0)
            DispatchQueue.main.asyncAfter(deadline: .now() + cap) { [weak self] in
                guard let self, self.finishContinuation != nil else { return }
                self.synthesizer.stopSpeaking(at: .immediate)
                // didCancel resumes; belt-and-braces if no delegate call:
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                    self?.finishContinuation?.resume()
                    self?.finishContinuation = nil
                }
            }
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
