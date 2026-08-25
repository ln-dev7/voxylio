// Voxylio for macOS — dubs the audio of ANY running app in your
// language, even without subtitles: per-app capture (Core Audio process
// tap), on-device transcription (Speech), on-device translation
// (Translation framework) and a synthesized voice over the ducked
// original. Menu-bar app, no Dock icon.

import AppKit
import SwiftUI

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // The Translation framework session lives in a hidden always-alive
        // window; install it at LAUNCH (not when the popover first opens)
        // so a session is warming up before the first sentence arrives.
        TranslationHostInstaller.installIfNeeded()
    }
}

@main
struct VoxylioApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var orchestrator = Orchestrator()

    var body: some Scene {
        MenuBarExtra("Voxylio", systemImage: "waveform.circle.fill") {
            MenuView()
                .environmentObject(orchestrator)
        }
        .menuBarExtraStyle(.window)
    }
}
