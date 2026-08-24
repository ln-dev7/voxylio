// Replays the tapped (muted-at-source) original audio at the chosen
// "original volume" — the macOS equivalent of the extension's ducking.
// 0% keeps only the dub; 100% keeps the original at full level.

import AVFoundation
import Foundation

final class PassthroughPlayer {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var converter: AVAudioConverter?
    private var inputFormat: AVAudioFormat?
    private var started = false

    /// 0.0 … 1.0 — the ducked level of the original audio.
    var volume: Float {
        get { player.volume }
        set { player.volume = max(0, min(1, newValue)) }
    }

    func start(inputFormat: AVAudioFormat, volume: Float) throws {
        self.inputFormat = inputFormat
        engine.attach(player)
        let outFormat = engine.mainMixerNode.outputFormat(forBus: 0)
        engine.connect(player, to: engine.mainMixerNode, format: outFormat)
        if inputFormat != outFormat {
            converter = AVAudioConverter(from: inputFormat, to: outFormat)
        }
        try engine.start()
        player.volume = max(0, min(1, volume))
        player.play()
        started = true
    }

    func enqueue(_ buffer: AVAudioPCMBuffer) {
        guard started else { return }
        if let converter {
            let outFormat = engine.mainMixerNode.outputFormat(forBus: 0)
            let ratio = outFormat.sampleRate / buffer.format.sampleRate
            let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 64
            guard
                let out = AVAudioPCMBuffer(pcmFormat: outFormat, frameCapacity: capacity)
            else { return }
            var consumed = false
            var error: NSError?
            converter.convert(to: out, error: &error) { _, outStatus in
                if consumed {
                    outStatus.pointee = .noDataNow
                    return nil
                }
                consumed = true
                outStatus.pointee = .haveData
                return buffer
            }
            if error == nil, out.frameLength > 0 {
                player.scheduleBuffer(out, completionHandler: nil)
            }
        } else {
            player.scheduleBuffer(buffer, completionHandler: nil)
        }
    }

    func stop() {
        guard started else { return }
        player.stop()
        engine.stop()
        engine.detach(player)
        converter = nil
        started = false
    }

    deinit { stop() }
}
