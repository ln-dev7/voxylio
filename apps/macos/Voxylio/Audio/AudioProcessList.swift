// Enumerates the audio-capable processes and groups them by the APP
// responsible for them. Modern apps split audio into helper processes
// (Chrome → com.google.Chrome.helper, Safari → WebKit WebContent…):
// tapping only the main process captures nothing. Each entry therefore
// carries EVERY process object belonging to the app.

import AppKit
import AudioToolbox
import CoreAudio
import Darwin
import Foundation

struct AudioAppInfo: Identifiable, Hashable {
    enum Target: Hashable {
        /// Mixdown of these process objects (the app + its helpers).
        case processes([AudioObjectID])
        /// Everything on the system except Voxylio itself (feedback-safe).
        case systemWide
    }

    let id: String
    let name: String
    let target: Target

    static let systemAudio = AudioAppInfo(
        id: "system", name: "Tout le système", target: .systemWide)
}

enum AudioProcessList {
    // responsibility_get_pid_responsible_for_pid: private but stable —
    // the only way to attribute helper processes (Chrome/Safari) to the
    // app the user actually picked. Falls back to the pid itself.
    private typealias ResponsibleFn = @convention(c) (pid_t) -> pid_t
    private static let responsibleFor: ResponsibleFn? = {
        guard let sym = dlsym(dlopen(nil, RTLD_NOW), "responsibility_get_pid_responsible_for_pid")
        else { return nil }
        return unsafeBitCast(sym, to: ResponsibleFn.self)
    }()

    private static func address(_ selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress {
        AudioObjectPropertyAddress(
            mSelector: selector,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
    }

    static func processObjects() -> [AudioObjectID] {
        var addr = address(kAudioHardwarePropertyProcessObjectList)
        var size: UInt32 = 0
        guard
            AudioObjectGetPropertyDataSize(
                AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size) == noErr
        else { return [] }
        var list = [AudioObjectID](
            repeating: 0, count: Int(size) / MemoryLayout<AudioObjectID>.size)
        guard
            AudioObjectGetPropertyData(
                AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &list) == noErr
        else { return [] }
        return list
    }

    static func pid(of object: AudioObjectID) -> pid_t? {
        var addr = address(kAudioProcessPropertyPID)
        var value: pid_t = 0
        var size = UInt32(MemoryLayout<pid_t>.size)
        guard AudioObjectGetPropertyData(object, &addr, 0, nil, &size, &value) == noErr else {
            return nil
        }
        return value
    }

    /// Voxylio's own process object (excluded from the system-wide tap
    /// so the passthrough + dub can never feed back into the capture).
    static func ownProcessObject() -> AudioObjectID? {
        var addr = address(kAudioHardwarePropertyTranslatePIDToProcessObject)
        var pid = getpid()
        var object = AudioObjectID(kAudioObjectUnknown)
        var size = UInt32(MemoryLayout<AudioObjectID>.size)
        let err = withUnsafeMutablePointer(to: &pid) { pidPtr in
            AudioObjectGetPropertyData(
                AudioObjectID(kAudioObjectSystemObject), &addr,
                UInt32(MemoryLayout<pid_t>.size), pidPtr, &size, &object)
        }
        return err == noErr && object != kAudioObjectUnknown ? object : nil
    }

    /// One entry per RESPONSIBLE app, each carrying all its process
    /// objects (main + helpers), plus the system-wide entry on top.
    static func runningAudioApps() -> [AudioAppInfo] {
        var groups: [pid_t: [AudioObjectID]] = [:]
        let ownPid = getpid()
        for object in processObjects() {
            guard let pid = pid(of: object), pid > 0 else { continue }
            let responsible = responsibleFor?(pid) ?? pid
            guard responsible != ownPid, pid != ownPid else { continue }
            groups[responsible, default: []].append(object)
        }
        var apps: [AudioAppInfo] = []
        for (responsiblePid, objects) in groups {
            guard let app = NSRunningApplication(processIdentifier: responsiblePid) else {
                continue
            }
            // Skip pure daemons, keep everything with a user-facing name.
            let name = app.localizedName ?? app.bundleIdentifier ?? "pid \(responsiblePid)"
            if app.activationPolicy == .prohibited { continue }
            apps.append(
                AudioAppInfo(
                    id: app.bundleIdentifier ?? "pid.\(responsiblePid)",
                    name: name,
                    target: .processes(objects.sorted())
                ))
        }
        apps.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        return [.systemAudio] + apps
    }
}
