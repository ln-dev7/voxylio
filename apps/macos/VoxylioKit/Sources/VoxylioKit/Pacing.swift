// Speech pacing — port of packages/core/src/pacing.js. Gentle catch-up:
// never more than +25% over the setting, nor ×1.45 absolute, then follow
// the player's own speed. Arithmetic order mirrors JS for bit parity.

import Foundation

public let wordsPerSecond = 2.6 // at rate 1

/// Mirrors JS `text.split(/\s+/).length`: a leading or trailing
/// whitespace run yields an (empty) segment, and "" counts as one.
func jsWhitespaceSegmentCount(_ s: String) -> Int {
    var runs = 0
    var inRun = false
    for ch in s {
        if ch.isWhitespace {
            if !inRun {
                runs += 1
                inRun = true
            }
        } else {
            inRun = false
        }
    }
    return runs + 1
}

public func computeUtteranceRate(
    text: String, cueDur: Double, baseRate: Double, playbackRate: Double = 1
) -> Double {
    let words = Double(jsWhitespaceSegmentCount(text))
    let estimated = words / wordsPerSecond
    var rate = baseRate
    if cueDur > 0.5 {
        let ratio = estimated / baseRate / cueDur
        if ratio > 1.15 {
            rate = min(baseRate * ratio, baseRate * 1.25, 1.45)
        }
    }
    let pr = playbackRate == 0 ? 1 : playbackRate
    return min(rate * pr, 3)
}
