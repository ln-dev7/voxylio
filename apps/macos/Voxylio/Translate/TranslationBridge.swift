// Proof P3 — Apple Translation framework (macOS 15+, on-device, free)
// with the same best-effort online fallback the extension uses.
//
// TranslationSession can only be obtained through SwiftUI's
// .translationTask modifier, so the app keeps a tiny always-alive hidden
// window hosting TranslationHostView; requests flow through this bridge
// and are answered from inside the translationTask closure.

import Foundation
import SwiftUI
import Translation

@MainActor
final class TranslationBridge: ObservableObject {
    static let shared = TranslationBridge()

    @Published private(set) var configuration: TranslationSession.Configuration?
    private var queue: [(text: String, cont: CheckedContinuation<String, Error>)] = []
    private var feeder: ((String) async throws -> String)?

    /// Reconfigure for a language pair; restarts the hosted session.
    func setPair(source: String, target: String) {
        let src = Locale.Language(identifier: source)
        let dst = Locale.Language(identifier: target)
        configuration = TranslationSession.Configuration(source: src, target: dst)
    }

    func invalidate() {
        configuration?.invalidate()
    }

    /// Called from TranslationHostView's translationTask closure: serve
    /// queued requests for as long as this session lives.
    func serve(with session: TranslationSession) async {
        do {
            try await session.prepareTranslation()
        } catch {
            // Model not installed / pair unsupported: the fallback handles it.
        }
        feeder = { text in
            let response = try await session.translate(text)
            return response.targetText
        }
        flushQueue()
    }

    func sessionEnded() {
        feeder = nil
    }

    private func flushQueue() {
        guard feeder != nil else { return }
        let pending = queue
        queue.removeAll()
        for item in pending {
            Task { await self.run(item.text, item.cont) }
        }
    }

    private func run(_ text: String, _ cont: CheckedContinuation<String, Error>) async {
        guard let feeder else {
            queue.append((text, cont))
            return
        }
        do {
            cont.resume(returning: try await feeder(text))
        } catch {
            cont.resume(throwing: error)
        }
    }

    /// Apple Translation first; unofficial online endpoint as fallback
    /// (same chain defaults as the extension: local → best-effort cloud).
    func translate(_ text: String, source: String, target: String) async -> String? {
        if feeder != nil || configuration != nil {
            do {
                let out = try await withCheckedThrowingContinuation { cont in
                    Task { await self.run(text, cont) }
                }
                return out
            } catch {
                /* fall through to the online fallback */
            }
        }
        return await Self.gtxFallback(text, source: source, target: target)
    }

    /// Best-effort online fallback (no key, no SLA) — mirror of the
    /// extension's background provider.
    static func gtxFallback(_ text: String, source: String, target: String) async -> String? {
        var comps = URLComponents(string: "https://translate.googleapis.com/translate_a/single")!
        comps.queryItems = [
            .init(name: "client", value: "gtx"),
            .init(name: "sl", value: source.isEmpty ? "auto" : source),
            .init(name: "tl", value: target),
            .init(name: "dt", value: "t"),
            .init(name: "q", value: text),
        ]
        guard let url = comps.url else { return nil }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
            guard
                let root = try JSONSerialization.jsonObject(with: data) as? [Any],
                let segments = root.first as? [Any]
            else { return nil }
            let out = segments
                .compactMap { ($0 as? [Any])?.first as? String }
                .joined()
            return out.isEmpty ? nil : out
        } catch {
            return nil
        }
    }
}

/// Invisible view living in a hidden always-alive window; hosts the
/// Translation framework session for the whole app.
struct TranslationHostView: View {
    @ObservedObject private var bridge = TranslationBridge.shared

    var body: some View {
        Color.clear
            .frame(width: 1, height: 1)
            .translationTask(bridge.configuration) { session in
                await bridge.serve(with: session)
                bridge.sessionEnded()
            }
    }
}

/// Creates the offscreen host window once at launch.
@MainActor
enum TranslationHostInstaller {
    private static var window: NSWindow?

    static func installIfNeeded() {
        guard window == nil else { return }
        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1, height: 1),
            styleMask: [.borderless], backing: .buffered, defer: false)
        w.isOpaque = false
        w.alphaValue = 0
        w.ignoresMouseEvents = true
        w.level = .floating
        w.collectionBehavior = [.canJoinAllSpaces, .stationary]
        w.contentView = NSHostingView(rootView: TranslationHostView())
        w.orderFrontRegardless()
        window = w
    }
}
