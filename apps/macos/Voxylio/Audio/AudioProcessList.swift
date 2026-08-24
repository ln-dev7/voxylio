// Enumerates the running processes Core Audio knows about, so the user
// can pick which app to dub (Chrome, Safari, VLC, Zoom…).

import AppKit
import AudioToolbox
import CoreAudio
import Foundation

struct AudioAppInfo: Identifiable, Hashable {
    let objectID: AudioObjectID
    let pid: pid_t
    let name: String
    let bundleID: String
    var id: AudioObjectID { objectID }
}

enum AudioProcessList {
    private static func propertyAddress(_ selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress {
        AudioObjectPropertyAddress(
            mSelector: selector,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
    }

    /// All process objects the HAL currently exposes.
    static func processObjects() -> [AudioObjectID] {
        var address = propertyAddress(kAudioHardwarePropertyProcessObjectList)
        var size: UInt32 = 0
        guard
            AudioObjectGetPropertyDataSize(
                AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size) == noErr
        else { return [] }
        let count = Int(size) / MemoryLayout<AudioObjectID>.size
        var list = [AudioObjectID](repeating: 0, count: count)
        guard
            AudioObjectGetPropertyData(
                AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &size, &list) == noErr
        else { return [] }
        return list
    }

    private static func pid(of object: AudioObjectID) -> pid_t? {
        var address = propertyAddress(kAudioProcessPropertyPID)
        var value: pid_t = 0
        var size = UInt32(MemoryLayout<pid_t>.size)
        guard AudioObjectGetPropertyData(object, &address, 0, nil, &size, &value) == noErr else {
            return nil
        }
        return value
    }

    /// User-facing list: deduplicated by app, named via NSRunningApplication.
    static func runningAudioApps() -> [AudioAppInfo] {
        var byBundle: [String: AudioAppInfo] = [:]
        for object in processObjects() {
            guard let pid = pid(of: object), pid > 0 else { continue }
            guard let app = NSRunningApplication(processIdentifier: pid) else { continue }
            let bundleID = app.bundleIdentifier ?? "pid.\(pid)"
            guard app.activationPolicy != .prohibited || bundleID.contains("browser") else {
                // Keep regular apps; skip most daemons.
                continue
            }
            let name = app.localizedName ?? bundleID
            if byBundle[bundleID] == nil {
                byBundle[bundleID] = AudioAppInfo(
                    objectID: object, pid: pid, name: name, bundleID: bundleID)
            }
        }
        return byBundle.values.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }
}
