// Voxylio for macOS — dubs the audio of ANY running app in your
// language, even without subtitles: per-app capture (Core Audio process
// tap), on-device transcription (Speech), on-device translation
// (Translation framework) and a synthesized voice over the ducked
// original. Menu-bar app, no Dock icon.

import SwiftUI

@main
struct VoxylioApp: App {
    @StateObject private var orchestrator = Orchestrator()

    var body: some Scene {
        MenuBarExtra("Voxylio", systemImage: "waveform.circle.fill") {
            MenuView()
                .environmentObject(orchestrator)
                .onAppear {
                    // The Translation framework session lives in a hidden
                    // always-alive window (see TranslationBridge).
                    TranslationHostInstaller.installIfNeeded()
                }
        }
        .menuBarExtraStyle(.window)
    }
}
