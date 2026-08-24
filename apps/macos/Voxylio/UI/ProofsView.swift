// The P1–P4 proof harness (docs/IMPLEMENTATION_PLAN.md §E0), embedded in
// the app rather than as separate targets: each proof runs against the
// exact production code path and reports its measured numbers here.
// Record the results in apps/macos/Proofs/README.md.

import SwiftUI
import Translation

struct ProofsView: View {
    @EnvironmentObject private var orchestrator: Orchestrator
    @State private var p3Report = ""
    @State private var runningP3 = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Divider()
            Text("Proofs").font(.caption).bold().foregroundStyle(.secondary)

            // P1 + P2 + P4 run live through the real pipeline: start
            // dubbing, then read the counters below.
            statsGrid

            HStack {
                Button("P3: translation availability") {
                    Task { await runP3() }
                }
                .disabled(runningP3)
                if runningP3 { ProgressView().controlSize(.small) }
            }
            if !p3Report.isEmpty {
                ScrollView {
                    Text(p3Report)
                        .font(.system(size: 10, design: .monospaced))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 120)
            }

            Button("Copy diagnostics") {
                let s = orchestrator.stats
                let diag = """
                Voxylio macOS diagnostics
                status: \(String(describing: orchestrator.status))
                buffers: \(s.buffers)  partials: \(s.partials)
                finalized: \(s.finalized)  spoken: \(s.spoken)
                skipped: \(s.skipped)  translateErrors: \(s.translateErrors)
                """
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(diag, forType: .string)
            }
            .font(.caption)
        }
    }

    private var statsGrid: some View {
        let s = orchestrator.stats
        return Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 2) {
            GridRow {
                Text("P1 buffers"); Text("\(s.buffers)").monospacedDigit()
                Text("P2 partials"); Text("\(s.partials)").monospacedDigit()
            }
            GridRow {
                Text("finalized"); Text("\(s.finalized)").monospacedDigit()
                Text("P4 spoken"); Text("\(s.spoken)").monospacedDigit()
            }
            GridRow {
                Text("skipped"); Text("\(s.skipped)").monospacedDigit()
                Text("tr-errors"); Text("\(s.translateErrors)").monospacedDigit()
            }
        }
        .font(.system(size: 10, design: .monospaced))
        .foregroundStyle(.secondary)
    }

    /// P3 — Apple Translation availability matrix for our pairs.
    private func runP3() async {
        runningP3 = true
        defer { runningP3 = false }
        let availability = LanguageAvailability()
        let langs = ["en", "fr", "es", "it", "de", "pt"]
        var lines: [String] = ["pair    status"]
        for src in langs {
            for dst in langs where dst != src {
                let s = Locale.Language(identifier: src)
                let d = Locale.Language(identifier: dst)
                let status = await availability.status(from: s, to: d)
                let label: String
                switch status {
                case .installed: label = "installed"
                case .supported: label = "supported (download on first use)"
                case .unsupported: label = "UNSUPPORTED"
                @unknown default: label = "unknown"
                }
                lines.append("\(src)→\(dst)  \(label)")
            }
        }
        p3Report = lines.joined(separator: "\n")
    }
}
