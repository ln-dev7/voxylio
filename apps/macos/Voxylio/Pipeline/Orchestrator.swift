// The dubbing pipeline state machine — the native mirror of the content
// script's controller: capture → transcribe (partial/final) → finalize by
// text stability → translate → speak. Same invariants as the extension:
// bounded queue, stale-segment skip, spoken-sentence registry, and a
// generation counter that voids every in-flight async result after a
// stop or configuration change.

import AVFoundation
import Foundation
import SwiftUI
import VoxylioKit

@MainActor
final class Orchestrator: ObservableObject {
    enum Status: Equatable {
        case idle
        case starting
        case capturing(appName: String)
        case error(String)
    }

    struct Stats {
        var buffers = 0
        var partials = 0
        var finalized = 0
        var spoken = 0
        var skipped = 0
        var translateErrors = 0
    }

    @Published private(set) var status: Status = .idle
    @Published private(set) var lastOriginal = ""
    @Published private(set) var lastDubbed = ""
    @Published private(set) var stats = Stats()
    /// Non-fatal problem surfaced in the UI (e.g. capture delivers no audio).
    @Published private(set) var warning: String?

    // Config (set at start)
    private var sourceLang = "en"
    private var targetLang = "fr"
    private var voiceIdentifier: String?
    private var baseRate = 1.1

    // Pipeline pieces
    private var tap: ProcessTap?
    private var passthrough: PassthroughPlayer?
    private var transcriber: Transcriber?
    private let speaker = DubSpeaker()

    // Registries (mirror of the extension)
    private var generation = 0
    private var spokenHashes: Set<String> = []
    private var queue: [(text: String, duration: Double)] = []
    private let queueBound = 2
    private var pumping = false

    // Draft assembly (rollup partials from SFSpeech)
    private var draftText = ""
    private var draftStart: TimeInterval = 0
    private var draftUpdatedAt = Date()
    private var stabilityTimer: Timer?

    /// Live-adjustable original (ducked) volume, 0…1.
    var originalVolume: Float = 0.12 {
        didSet { passthrough?.volume = originalVolume }
    }

    func start(
        app: AudioAppInfo,
        sourceLang: String,
        targetLang: String,
        voiceIdentifier: String?,
        baseRate: Double,
        originalVolume: Float
    ) async {
        guard case .idle = status else { return }
        status = .starting
        self.sourceLang = sourceLang
        self.targetLang = targetLang
        self.voiceIdentifier = voiceIdentifier
        self.baseRate = baseRate
        self.originalVolume = originalVolume
        generation += 1
        let gen = generation
        spokenHashes.removeAll()
        queue.removeAll()
        stats = Stats()

        guard await Transcriber.requestAuthorization() else {
            status = .error("Speech recognition was not authorized.")
            return
        }
        guard
            let transcriber = Transcriber(
                locale: Locale(identifier: Self.speechLocale(for: sourceLang)))
        else {
            status = .error("No speech recognizer for \(sourceLang).")
            return
        }
        self.transcriber = transcriber

        TranslationBridge.shared.setPair(source: sourceLang, target: targetLang)

        let tap = ProcessTap(target: app.target)
        let passthrough = PassthroughPlayer()
        self.tap = tap
        self.passthrough = passthrough

        do {
            try tap.start { [weak self] buffer in
                // Realtime-adjacent thread: fan out, no allocation-heavy work.
                passthrough.enqueue(buffer)
                transcriber.append(buffer)
                Task { @MainActor [weak self] in
                    guard let self, self.generation == gen else { return }
                    self.stats.buffers += 1
                }
            }
            guard let format = tap.format else { throw ProcessTap.TapError.osStatus("format", -1) }
            try passthrough.start(inputFormat: format, volume: originalVolume)
        } catch {
            teardown()
            status = .error(error.localizedDescription)
            return
        }

        transcriber.start { [weak self] event in
            Task { @MainActor [weak self] in
                self?.onTranscript(event, gen: gen)
            }
        }

        // Stability heuristics: same constants as the extension —
        // 350 ms when the draft already ends a sentence, 650 ms otherwise.
        stabilityTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.checkStability(gen: gen)
            }
        }

        // Watchdog: no buffer after 3 s means the capture is not really
        // flowing (permission missing, silent target, wrong process).
        warning = nil
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: .seconds(3))
            guard let self, self.generation == gen else { return }
            if self.stats.buffers == 0 {
                self.warning =
                    "Aucun audio capté. Vérifie que la vidéo joue avec du son, "
                    + "et que Voxylio est autorisé dans Réglages Système → "
                    + "Confidentialité → Enregistrement de l'écran et audio du système "
                    + "(puis relance l'app). Sinon, essaie la cible « Tout le système »."
            } else if self.stats.partials == 0 {
                Task { @MainActor [weak self] in
                    try? await Task.sleep(for: .seconds(5))
                    guard let self, self.generation == gen else { return }
                    if self.stats.partials == 0 {
                        self.warning =
                            "Audio capté mais rien de transcrit — la langue source "
                            + "correspond-elle à la vidéo ? (reconnaissance \(self.sourceLang))"
                    }
                }
            }
        }

        status = .capturing(appName: app.name)
    }

    func stop() {
        generation += 1
        teardown()
        warning = nil
        status = .idle
    }

    private func teardown() {
        stabilityTimer?.invalidate()
        stabilityTimer = nil
        transcriber?.stop()
        transcriber = nil
        tap?.stop()
        tap = nil
        passthrough?.stop()
        passthrough = nil
        speaker.cancel()
        queue.removeAll()
        draftText = ""
        pumping = false
    }

    // MARK: - Draft → sentences

    private func onTranscript(_ event: TranscriptEvent, gen: Int) {
        guard gen == generation else { return }
        stats.partials += 1
        if draftText.isEmpty { draftStart = event.timestamp }
        // SFSpeech partials are cumulative for the utterance: pure rollup.
        // mergeRollup also covers the rotate-task boundary (sliding shape).
        if let merged = mergeRollup(
            lastText: draftText.isEmpty ? nil : draftText,
            lastEnd: event.timestamp,
            start: event.timestamp,
            end: event.timestamp,
            text: event.text
        ) {
            draftText = merged.text
        } else {
            // Unrelated new utterance: finalize what we had first.
            if !draftText.isEmpty { finalizeDraft(endAt: event.timestamp, gen: gen) }
            draftText = event.text
            draftStart = event.timestamp
        }
        draftUpdatedAt = Date()
        lastOriginal = draftText
        if event.isFinal {
            finalizeDraft(endAt: event.timestamp, gen: gen)
        }
    }

    private func checkStability(gen: Int) {
        guard gen == generation, !draftText.isEmpty else { return }
        let quiet = Date().timeIntervalSince(draftUpdatedAt)
        let needed = endsSentence(draftText) ? 0.35 : 0.65
        if quiet >= needed {
            finalizeDraft(endAt: draftStart + quiet, gen: gen)
        }
    }

    private func finalizeDraft(endAt: TimeInterval, gen: Int) {
        let text = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        draftText = ""
        guard !text.isEmpty else { return }
        let hash = textHash(text)
        guard !spokenHashes.contains(hash) else { return }
        spokenHashes.insert(hash)
        stats.finalized += 1
        let duration = max(0.8, endAt - draftStart)
        queue.append((text, duration))
        // Bounded queue: drop the OLDEST when we fall behind — a stale
        // sentence must never be spoken over a much later one.
        while queue.count > queueBound {
            queue.removeFirst()
            stats.skipped += 1
        }
        pump(gen: gen)
    }

    // MARK: - Translate → speak

    private func pump(gen: Int) {
        guard !pumping else { return }
        pumping = true
        Task { @MainActor in
            defer { pumping = false }
            while gen == self.generation, !self.queue.isEmpty {
                let item = self.queue.removeFirst()
                // Glossary protection, exactly like the extension.
                let (protectedText, found) = protectTerms(item.text)
                let raw = await TranslationBridge.shared.translate(
                    found.isEmpty ? item.text : protectedText,
                    source: self.sourceLang, target: self.targetLang)
                guard gen == self.generation else { return } // stale
                guard var translated = raw else {
                    self.stats.translateErrors += 1
                    continue
                }
                if !found.isEmpty {
                    let (restored, ok) = restoreTerms(translated, found: found)
                    if ok {
                        translated = restored
                    } else if let retry = await TranslationBridge.shared.translate(
                        item.text, source: self.sourceLang, target: self.targetLang)
                    {
                        translated = retry
                    }
                    guard gen == self.generation else { return }
                }
                self.lastDubbed = translated
                self.stats.spoken += 1
                await self.speaker.speak(
                    translated,
                    language: self.targetLang,
                    voiceIdentifier: self.voiceIdentifier,
                    segmentDuration: item.duration,
                    baseRate: self.baseRate)
            }
        }
    }

    // MARK: - Helpers

    static func speechLocale(for lang: String) -> String {
        switch lang {
        case "en": return "en-US"
        case "fr": return "fr-FR"
        case "es": return "es-ES"
        case "it": return "it-IT"
        case "de": return "de-DE"
        case "pt": return "pt-PT"
        default: return lang
        }
    }
}
