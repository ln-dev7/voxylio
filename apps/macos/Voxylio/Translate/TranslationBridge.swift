// Proof P3 — Apple Translation framework (macOS 15+, on-device, free)
// with the same best-effort online fallback the extension uses.
//
// Hard rule learned from the extension: NEVER let a translation stage
// hang the pipeline. Every path here has a deadline; on timeout or
// error the online fallback answers, and the on-device session takes
// over whenever it becomes ready.
//
// TranslationSession can only be obtained through SwiftUI's
// .translationTask modifier, so the app keeps a tiny always-alive hidden
// window hosting TranslationHostView (installed at launch); the serving
// closure holds the session open until cancelled.

import Foundation
import SwiftUI
import Translation

struct TranslationTimeout: Error {}

@MainActor
final class TranslationBridge: ObservableObject {
    static let shared = TranslationBridge()

    @Published private(set) var configuration: TranslationSession.Configuration?
    private var feeder: ((String) async throws -> String)?
    private(set) var appleReady = false
    private var pending: [UUID: (text: String, cont: CheckedContinuation<String, Error>)] = [:]

    /// Reconfigure for a language pair; restarts the hosted session.
    func setPair(source: String, target: String) {
        appleReady = false
        feeder = nil
        failPending(TranslationTimeout())
        configuration = TranslationSession.Configuration(
            source: Locale.Language(identifier: source),
            target: Locale.Language(identifier: target))
    }

    /// Runs inside the translationTask closure: publishes the feeder,
    /// flushes what queued while the session warmed up, then HOLDS the
    /// closure open (session validity is scoped to it) until cancelled.
    func serve(with session: TranslationSession) async {
        if appleReady { return } // another host already serves
        do {
            try await session.prepareTranslation()
        } catch {
            // Model not installed / pair unsupported: the fallback covers
            // it; translate() below still tries and fails fast.
        }
        feeder = { text in try await session.translate(text).targetText }
        appleReady = true
        flushPending()
        while !Task.isCancelled {
            try? await Task.sleep(for: .seconds(1))
        }
        appleReady = false
        feeder = nil
        failPending(CancellationError())
    }

    private func flushPending() {
        guard let feeder else { return }
        let items = pending
        pending.removeAll()
        for (_, item) in items {
            Task { @MainActor in
                do {
                    item.cont.resume(returning: try await feeder(item.text))
                } catch {
                    item.cont.resume(throwing: error)
                }
            }
        }
    }

    private func failPending(_ error: Error) {
        let items = pending
        pending.removeAll()
        for (_, item) in items { item.cont.resume(throwing: error) }
    }

    /// On-device attempt with a hard deadline — queued while the session
    /// warms up, expired by the deadline if it never does.
    private func appleTranslate(_ text: String, deadline: Double) async throws -> String {
        if let feeder {
            return try await Self.withTimeout(deadline) { try await feeder(text) }
        }
        let id = UUID()
        return try await withCheckedThrowingContinuation { cont in
            pending[id] = (text, cont)
            Task { @MainActor in
                try? await Task.sleep(for: .seconds(deadline))
                if let waiting = self.pending.removeValue(forKey: id) {
                    waiting.cont.resume(throwing: TranslationTimeout())
                }
            }
        }
    }

    /// Apple Translation first (bounded), online fallback second. Never
    /// hangs, returns nil only when BOTH paths failed.
    func translate(_ text: String, source: String, target: String) async -> String? {
        if let out = try? await appleTranslate(text, deadline: 4) {
            return out
        }
        return await Self.gtxFallback(text, source: source, target: target)
    }

    static func withTimeout<T: Sendable>(
        _ seconds: Double, _ op: @escaping @Sendable () async throws -> T
    ) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask { try await op() }
            group.addTask {
                try await Task.sleep(for: .seconds(seconds))
                throw TranslationTimeout()
            }
            guard let result = try await group.next() else { throw TranslationTimeout() }
            group.cancelAll()
            return result
        }
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
            let (data, response) = try await TranslationBridge.withTimeout(6) {
                try await URLSession.shared.data(from: url)
            }
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
