// Sentence reconstruction for progressive captions — port of
// packages/core/src/grouping.js. Invariants (identical to JS):
//  - a group's `id` NEVER depends on its mutable text — only on its start;
//  - `version` changes whenever the text changes;
//  - the LAST group of a live stream is a draft (final == false);
//  - roll-up AND sliding-window feeds are merged into one cue.

import Foundation

public let groupMaxLen = 280 // max characters per sentence (safety cap)
public let groupMaxGap = 1.4 // silence (s) that closes a sentence

/// Cheap stable content hash (FNV-1a, 32-bit over UTF-16 units, base36) —
/// bit-identical to the JS `textHash`.
public func textHash(_ s: String) -> String {
    var h: UInt32 = 0x811C_9DC5
    for unit in s.utf16 {
        h ^= UInt32(unit)
        h = h &* 0x0100_0193
    }
    return String(h, radix: 36)
}

private let wordPunct: Set<Character> = [
    ".", ",", "!", "?", "…", ";", ":", "'", "\"", "«", "»", "(", ")", "[", "]",
]

func normalizeWords(_ s: String) -> [String] {
    let mapped = String(s.lowercased().map { wordPunct.contains($0) ? " " : $0 })
    return mapped.split(whereSeparator: { $0.isWhitespace }).map(String.init)
}

/// Longest overlap (in words) between the END of `a` and the START of `b`.
public func wordOverlap(_ a: String, _ b: String, minWords: Int = 2) -> Int {
    let aw = normalizeWords(a)
    let bw = normalizeWords(b)
    let maxN = min(aw.count, bw.count)
    guard maxN >= minWords else { return 0 }
    for n in stride(from: maxN, through: minWords, by: -1) {
        var match = true
        for i in 0..<n where aw[aw.count - n + i] != bw[i] {
            match = false
            break
        }
        if match { return n }
    }
    return 0
}

public struct RollupMerge: Equatable {
    public let text: String
    public let end: Double
    public let grew: Bool
    public init(text: String, end: Double, grew: Bool) {
        self.text = text
        self.end = end
        self.grew = grew
    }
}

/// Merge an incoming caption into the previous cue when the feed is
/// progressive (roll-up growth or sliding window). Returns nil when the
/// incoming cue starts a new sentence.
public func mergeRollup(
    lastText: String?, lastEnd: Double, start: Double, end: Double, text: String
) -> RollupMerge? {
    guard let last = lastText else { return nil }
    if start > lastEnd + 0.6 { return nil }

    // Prefix relation (classic roll-up)
    if text.hasPrefix(last) || last.hasPrefix(text) {
        return RollupMerge(
            text: text.count > last.count ? text : last,
            end: max(lastEnd, end),
            grew: text.count > last.count
        )
    }

    // Sliding window: longest suffix of last == prefix of incoming
    let overlap = wordOverlap(last, text, minWords: 2)
    if overlap > 0 {
        let bw = normalizeWords(text)
        if overlap >= bw.count {
            // incoming is entirely contained in the tail of last
            return RollupMerge(text: last, end: max(lastEnd, end), grew: false)
        }
        // Replace last's overlapping tail with the FULL incoming text (the
        // incoming version of the shared words carries the richest
        // punctuation). Token starts mirror the JS /\S+/g scan.
        var starts: [String.Index] = []
        var inWord = false
        var i = last.startIndex
        while i < last.endIndex {
            if !last[i].isWhitespace {
                if !inWord {
                    starts.append(i)
                    inWord = true
                }
            } else {
                inWord = false
            }
            i = last.index(after: i)
        }
        let cutIdx = starts.count >= overlap ? starts[starts.count - overlap] : last.startIndex
        let head = String(last[last.startIndex..<cutIdx])
            .replacingOccurrences(of: "\\s+$", with: "", options: .regularExpression)
        let merged = head.isEmpty ? text : head + " " + text
        return RollupMerge(
            text: merged,
            end: max(lastEnd, end),
            grew: merged.count > last.count
        )
    }
    return nil
}

public struct Cue: Equatable {
    public let start: Double
    public let end: Double
    public let text: String
    public init(start: Double, end: Double, text: String) {
        self.start = start
        self.end = end
        self.text = text
    }
}

public struct Group: Equatable {
    public var start: Double
    public var end: Double
    public var text: String
    public var id: String
    public var version: String
    public var final: Bool
    /// Display/debug only — NEVER use as identity.
    public var key: String
}

/// Rebuild sentence groups from cues — deterministic, identical to JS.
public func buildGroups(_ cues: [Cue], maxLen: Int = groupMaxLen, maxGap: Double = groupMaxGap) -> [Group] {
    struct Building {
        var start: Double
        var end: Double
        var text: String
    }
    var groups: [Building] = []
    var cur: Building?
    for c in cues {
        let txt = cleanCaption(c.text)
        if txt.isEmpty { continue }
        if let current = cur,
            endsSentence(current.text) || c.start - current.end > maxGap
            || current.text.count > maxLen
        {
            groups.append(current)
            cur = nil
        }
        if cur == nil {
            cur = Building(start: c.start, end: c.end, text: txt)
        } else if cur!.text.hasSuffix(txt) {
            // Duplicated fragment (progressive captions): extend, don't repeat
            cur!.end = max(cur!.end, c.end)
        } else {
            cur!.end = max(cur!.end, c.end)
            cur!.text += " " + txt
        }
    }
    if let current = cur { groups.append(current) }

    return groups.enumerated().map { i, g in
        let id = "g" + String(Int((g.start * 100).rounded()))
        let version = textHash(g.text)
        return Group(
            start: g.start,
            end: g.end,
            text: g.text,
            id: id,
            version: version,
            final: i < groups.count - 1,
            key: id + ":" + version
        )
    }
}
