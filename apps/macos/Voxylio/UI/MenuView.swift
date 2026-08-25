// The menu-bar popover: app picker, language pair, voice, volumes, and
// the live status of the pipeline — the native sibling of the popup.

import AVFoundation
import SwiftUI

struct MenuView: View {
    @EnvironmentObject private var orchestrator: Orchestrator

    @State private var apps: [AudioAppInfo] = []
    @State private var selectedApp: AudioAppInfo?
    @AppStorage("sourceLang") private var sourceLang = "en"
    @AppStorage("targetLang") private var targetLang = "fr"
    @AppStorage("voiceId") private var voiceId = ""
    @AppStorage("baseRate") private var baseRate = 1.1
    @AppStorage("originalVolume") private var originalVolume = 0.12
    @State private var showProofs = false

    private let langs = ["en", "fr", "es", "it", "de", "pt"]

    private var isRunning: Bool {
        if case .capturing = orchestrator.status { return true }
        return false
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            appPicker
            languageRow
            voiceRow
            sliders
            statusCard
            actions
            if showProofs { ProofsView() }
        }
        .padding(14)
        .frame(width: 340)
        .onAppear(perform: refreshApps)
    }

    private var header: some View {
        HStack {
            Image(systemName: "waveform.circle.fill")
                .font(.title2)
                .foregroundStyle(.green)
            Text("Voxylio").font(.headline)
            Spacer()
            Button {
                showProofs.toggle()
            } label: {
                Image(systemName: "stethoscope")
            }
            .buttonStyle(.plain)
            .help("Proof harness (P1–P4 measurements)")
        }
    }

    private var appPicker: some View {
        HStack {
            Picker("App", selection: $selectedApp) {
                Text("Choose an app…").tag(AudioAppInfo?.none)
                ForEach(apps) { app in
                    Text(app.name).tag(Optional(app))
                }
            }
            Button {
                refreshApps()
            } label: {
                Image(systemName: "arrow.clockwise")
            }
            .help("Refresh the app list")
        }
        .disabled(isRunning)
    }

    private var languageRow: some View {
        HStack {
            Picker("From", selection: $sourceLang) {
                ForEach(langs, id: \.self) { Text($0.uppercased()).tag($0) }
            }
            Image(systemName: "arrow.right")
                .foregroundStyle(.secondary)
            Picker("To", selection: $targetLang) {
                ForEach(langs.filter { $0 != sourceLang }, id: \.self) {
                    Text($0.uppercased()).tag($0)
                }
            }
        }
        .labelsHidden()
        .disabled(isRunning)
    }

    private var voiceRow: some View {
        HStack {
            Picker("Voice", selection: $voiceId) {
                Text("Automatic").tag("")
                ForEach(DubSpeaker.voices(for: targetLang), id: \.identifier) { voice in
                    Text(voice.name).tag(voice.identifier)
                }
            }
            Button {
                previewVoice()
            } label: {
                Image(systemName: "play.circle")
            }
            .help("Preview the voice")
        }
    }

    private var sliders: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Original").frame(width: 60, alignment: .leading)
                Slider(value: $originalVolume, in: 0...1)
                    .onChange(of: originalVolume) { _, v in
                        orchestrator.originalVolume = Float(v)
                    }
                Text("\(Int(originalVolume * 100)) %")
                    .monospacedDigit()
                    .frame(width: 44, alignment: .trailing)
            }
            HStack {
                Text("Voice").frame(width: 60, alignment: .leading)
                Slider(value: $baseRate, in: 0.8...1.6, step: 0.05)
                Text("×\(baseRate, specifier: "%.2f")")
                    .monospacedDigit()
                    .frame(width: 44, alignment: .trailing)
            }
        }
        .font(.caption)
    }

    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            switch orchestrator.status {
            case .idle:
                Text("Idle — pick an app and press Start.")
                    .foregroundStyle(.secondary)
            case .starting:
                Text("Starting…").foregroundStyle(.secondary)
            case .capturing(let name):
                Label("Dubbing \(name)", systemImage: "dot.radiowaves.left.and.right")
                    .foregroundStyle(.green)
                if !orchestrator.lastOriginal.isEmpty {
                    Text(orchestrator.lastOriginal)
                        .font(.caption2).foregroundStyle(.secondary).lineLimit(2)
                }
                if !orchestrator.lastDubbed.isEmpty {
                    Text("“\(orchestrator.lastDubbed)”")
                        .font(.caption).bold().lineLimit(2)
                }
            case .error(let message):
                Label(message, systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.orange)
                    .font(.caption)
            }
            if let warning = orchestrator.warning {
                Label(warning, systemImage: "exclamationmark.bubble")
                    .foregroundStyle(.orange)
                    .font(.caption2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 8))
    }

    private var actions: some View {
        HStack {
            if isRunning {
                Button(role: .destructive) {
                    orchestrator.stop()
                } label: {
                    Label("Stop", systemImage: "stop.fill")
                        .frame(maxWidth: .infinity)
                }
                .keyboardShortcut(.cancelAction)
            } else {
                Button {
                    guard let app = selectedApp else { return }
                    Task {
                        await orchestrator.start(
                            app: app,
                            sourceLang: sourceLang,
                            targetLang: targetLang,
                            voiceIdentifier: voiceId.isEmpty ? nil : voiceId,
                            baseRate: baseRate,
                            originalVolume: Float(originalVolume))
                    }
                } label: {
                    Label("Start dubbing", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .disabled(selectedApp == nil)
            }
            Button("Quit") { NSApp.terminate(nil) }
        }
    }

    private func refreshApps() {
        apps = AudioProcessList.runningAudioApps()
        if let current = selectedApp,
            !apps.contains(where: { $0.id == current.id })
        {
            selectedApp = nil
        }
    }

    private func previewVoice() {
        let samples = [
            "fr": "Bonjour ! Voici la voix de votre doublage.",
            "es": "¡Hola! Esta es la voz de tu doblaje.",
            "it": "Ciao! Questa è la voce del tuo doppiaggio.",
            "de": "Hallo! Das ist die Stimme deiner Synchronisation.",
            "pt": "Olá! Esta é a voz da sua dublagem.",
            "en": "Hi! This is your dubbing voice.",
        ]
        let utterance = AVSpeechUtterance(string: samples[targetLang] ?? samples["en"]!)
        if !voiceId.isEmpty, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
            utterance.voice = voice
        } else {
            utterance.voice = AVSpeechSynthesisVoice(
                language: Orchestrator.speechLocale(for: targetLang))
        }
        AVSpeechSynthesizer.shared.speak(utterance)
    }
}

extension AVSpeechSynthesizer {
    /// One shared instance for previews (a locally-scoped synthesizer is
    /// deallocated before it finishes speaking).
    static let shared = AVSpeechSynthesizer()
}
