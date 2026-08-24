// Caption text utilities — port of packages/core/src/subtitles.js.
// Every function must stay semantically identical to the JS reference;
// the shared vectors enforce it.

import Foundation

@inline(__always)
private func regexReplace(_ s: String, _ pattern: String, _ replacement: String) -> String {
    s.replacingOccurrences(of: pattern, with: replacement, options: .regularExpression)
}

private let soundCuePattern =
    "music|musique|applau|laugh|rire|sigh|soupir|cough|toux|inaudible|silence|bruit|noise|chuckle|cheer"

/// All-caps stage directions or known sound descriptions.
/// Mirror of: SOUND_CUE_RE.test(inner) || /^[^a-zà-ÿ]*$/.test(inner)
public func isSoundCue(_ inner: String) -> Bool {
    if inner.range(of: soundCuePattern, options: [.regularExpression, .caseInsensitive]) != nil {
        return true
    }
    // True when the string contains NO lowercase letter (a-z or à-ÿ,
    // i.e. U+00E0…U+00FF — the exact JS character class).
    for scalar in inner.unicodeScalars {
        if (0x61...0x7A).contains(scalar.value) || (0xE0...0xFF).contains(scalar.value) {
            return false
        }
    }
    return true
}

/// Dubbing-style cleanup: strip sound annotations ([Music], (applause), ♪)
/// and dialogue dashes — but PRESERVE informative parentheses.
public func cleanCaption(_ s: String) -> String {
    var out = regexReplace(s, "\\[[^\\]]*\\]", " ")

    // Parenthesized segments: keep informative ones, drop sound cues.
    if let re = try? NSRegularExpression(pattern: "\\(([^)]*)\\)") {
        let ns = out as NSString
        var rebuilt = ""
        var cursor = 0
        re.enumerateMatches(in: out, range: NSRange(location: 0, length: ns.length)) { m, _, _ in
            guard let m else { return }
            rebuilt += ns.substring(with: NSRange(location: cursor, length: m.range.location - cursor))
            let inner = ns.substring(with: m.range(at: 1))
            rebuilt += isSoundCue(inner) ? " " : ns.substring(with: m.range)
            cursor = m.range.location + m.range.length
        }
        rebuilt += ns.substring(from: cursor)
        out = rebuilt
    }

    out = regexReplace(out, "♪+", " ")
    out = regexReplace(out, "^[-–—]\\s*", "")
    out = regexReplace(out, "\\s+", " ")
    return out.trimmingCharacters(in: .whitespacesAndNewlines)
}

/// Mirror of /[.!?…](["')\]])?$/ on the trimmed string.
public func endsSentence(_ s: String) -> Bool {
    let trimmed = s.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.range(of: "[.!?…]([\"')\\]])?$", options: .regularExpression) != nil
}
