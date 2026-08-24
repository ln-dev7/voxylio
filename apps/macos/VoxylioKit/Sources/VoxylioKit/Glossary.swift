// Technical-term protection — port of packages/core/src/glossary.js.
// Terms professionals keep in English are shielded with ⟦n⟧ placeholders
// through translation, then restored verbatim.

import Foundation

public let protectedTerms = [
    "playground", "prompt", "framework", "codebase", "commit", "pull request",
    "code review", "backend", "frontend", "workflow", "pipeline", "token",
    "embedding", "debug", "build", "deploy", "refactoring", "refactor",
    "feature flag", "context window", "agent",
]

private let termRegex: NSRegularExpression = {
    let escaped = protectedTerms.map { NSRegularExpression.escapedPattern(for: $0) }
    // swiftlint:disable:next force_try
    return try! NSRegularExpression(
        pattern: "\\b(" + escaped.joined(separator: "|") + ")\\b",
        options: [.caseInsensitive]
    )
}()

public func protectTerms(_ text: String) -> (protectedText: String, found: [String]) {
    let ns = text as NSString
    var found: [String] = []
    var out = ""
    var cursor = 0
    termRegex.enumerateMatches(in: text, range: NSRange(location: 0, length: ns.length)) { m, _, _ in
        guard let m else { return }
        out += ns.substring(with: NSRange(location: cursor, length: m.range.location - cursor))
        found.append(ns.substring(with: m.range))
        out += "⟦\(found.count - 1)⟧"
        cursor = m.range.location + m.range.length
    }
    out += ns.substring(from: cursor)
    return (out, found)
}

private let placeholderRegex = try! NSRegularExpression(pattern: "⟦\\s*(\\d+)\\s*⟧")

public func restoreTerms(_ text: String, found: [String]) -> (restored: String, ok: Bool) {
    let ns = text as NSString
    let matches = placeholderRegex.matches(in: text, range: NSRange(location: 0, length: ns.length))
    var out = ""
    var cursor = 0
    for m in matches {
        out += ns.substring(with: NSRange(location: cursor, length: m.range.location - cursor))
        let idx = Int(ns.substring(with: m.range(at: 1))) ?? -1
        out += (idx >= 0 && idx < found.count) ? found[idx] : ""
        cursor = m.range.location + m.range.length
    }
    out += ns.substring(from: cursor)
    // ok only if every placeholder survived translation intact
    let ok = matches.count == found.count && !out.contains("⟦") && !out.contains("⟧")
    return (out, ok)
}
