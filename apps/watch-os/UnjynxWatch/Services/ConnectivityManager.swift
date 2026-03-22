import Foundation
import WatchConnectivity

// MARK: - Connectivity Manager

final class ConnectivityManager: NSObject, ObservableObject {
    static let shared = ConnectivityManager()

    @Published private(set) var isPhoneReachable = false
    @Published private(set) var cachedTasks: [WatchTask] = []
    @Published private(set) var cachedSummary: WatchSummary = .empty
    @Published private(set) var lastSyncDate: Date?

    private let session: WCSession
    private let tasksKey = "com.metaminds.unjynx.watch.tasks"
    private let summaryKey = "com.metaminds.unjynx.watch.summary"
    private let lastSyncKey = "com.metaminds.unjynx.watch.lastSync"
    private let authTokenKey = "com.metaminds.unjynx.watch.authToken"

    private override init() {
        self.session = WCSession.default
        super.init()

        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
        }

        loadCachedData()
    }

    // MARK: - Data Source Priority

    /// Fetches tasks using priority: WatchConnectivity > API > Cache.
    func fetchTasks() async -> [WatchTask] {
        // Priority 1: Try WatchConnectivity (phone sync)
        if isPhoneReachable {
            do {
                let tasks = try await requestTasksFromPhone()
                cacheData(tasks: tasks)
                return tasks
            } catch {
                // Fall through to API
            }
        }

        // Priority 2: Try direct API
        do {
            let tasks = try await APIClient.shared.getTasks()
            cacheData(tasks: tasks)
            return tasks
        } catch {
            // Fall through to cache
        }

        // Priority 3: Return cached data
        return cachedTasks
    }

    /// Fetches summary using priority: WatchConnectivity > API > Cache.
    func fetchSummary() async -> WatchSummary {
        if isPhoneReachable {
            do {
                let summary = try await requestSummaryFromPhone()
                cacheData(summary: summary)
                return summary
            } catch {
                // Fall through
            }
        }

        do {
            let summary = try await APIClient.shared.getSummary()
            cacheData(summary: summary)
            return summary
        } catch {
            return cachedSummary
        }
    }

    // MARK: - Phone Communication

    /// Sends a complete-task action to the phone.
    func sendCompleteAction(taskId: String) {
        guard isPhoneReachable else { return }

        let message: [String: Any] = [
            "action": "complete_task",
            "task_id": taskId,
            "timestamp": Date().timeIntervalSince1970
        ]

        session.sendMessage(message, replyHandler: nil) { error in
            print("[ConnectivityManager] Failed to send complete action: \(error)")
        }
    }

    /// Sends a snooze-task action to the phone.
    func sendSnoozeAction(taskId: String, minutes: Int) {
        guard isPhoneReachable else { return }

        let message: [String: Any] = [
            "action": "snooze_task",
            "task_id": taskId,
            "snooze_minutes": minutes,
            "timestamp": Date().timeIntervalSince1970
        ]

        session.sendMessage(message, replyHandler: nil) { error in
            print("[ConnectivityManager] Failed to send snooze action: \(error)")
        }
    }

    // MARK: - Request from Phone (async)

    private func requestTasksFromPhone() async throws -> [WatchTask] {
        try await withCheckedThrowingContinuation { continuation in
            let message: [String: Any] = ["request": "tasks"]

            session.sendMessage(message, replyHandler: { reply in
                guard let data = reply["tasks"] as? Data else {
                    continuation.resume(throwing: APIError.decodingFailed(
                        NSError(domain: "WC", code: -1)
                    ))
                    return
                }

                do {
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    let tasks = try decoder.decode([WatchTask].self, from: data)
                    continuation.resume(returning: tasks)
                } catch {
                    continuation.resume(throwing: APIError.decodingFailed(error))
                }
            }, errorHandler: { error in
                continuation.resume(throwing: error)
            })
        }
    }

    private func requestSummaryFromPhone() async throws -> WatchSummary {
        try await withCheckedThrowingContinuation { continuation in
            let message: [String: Any] = ["request": "summary"]

            session.sendMessage(message, replyHandler: { reply in
                guard let data = reply["summary"] as? Data else {
                    continuation.resume(throwing: APIError.decodingFailed(
                        NSError(domain: "WC", code: -1)
                    ))
                    return
                }

                do {
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    let summary = try decoder.decode(WatchSummary.self, from: data)
                    continuation.resume(returning: summary)
                } catch {
                    continuation.resume(throwing: APIError.decodingFailed(error))
                }
            }, errorHandler: { error in
                continuation.resume(throwing: error)
            })
        }
    }

    // MARK: - Local Cache

    private func loadCachedData() {
        let defaults = UserDefaults.standard

        if let data = defaults.data(forKey: tasksKey) {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            cachedTasks = (try? decoder.decode([WatchTask].self, from: data)) ?? []
        }

        if let data = defaults.data(forKey: summaryKey) {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            cachedSummary = (try? decoder.decode(WatchSummary.self, from: data)) ?? .empty
        }

        if let interval = defaults.object(forKey: lastSyncKey) as? Double {
            lastSyncDate = Date(timeIntervalSince1970: interval)
        }
    }

    private func cacheData(tasks: [WatchTask]? = nil, summary: WatchSummary? = nil) {
        let defaults = UserDefaults.standard
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        if let tasks {
            cachedTasks = tasks
            if let data = try? encoder.encode(tasks) {
                defaults.set(data, forKey: tasksKey)
            }
        }

        if let summary {
            cachedSummary = summary
            if let data = try? encoder.encode(summary) {
                defaults.set(data, forKey: summaryKey)
            }
        }

        lastSyncDate = Date()
        defaults.set(lastSyncDate?.timeIntervalSince1970, forKey: lastSyncKey)
    }
}

// MARK: - WCSessionDelegate

extension ConnectivityManager: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        DispatchQueue.main.async { [weak self] in
            self?.isPhoneReachable = session.isReachable
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { [weak self] in
            self?.isPhoneReachable = session.isReachable
        }
    }

    /// Receives applicationContext updates pushed from the iPhone app.
    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        if let tasksData = applicationContext["tasks"] as? Data,
           let tasks = try? decoder.decode([WatchTask].self, from: tasksData) {
            DispatchQueue.main.async { [weak self] in
                self?.cacheData(tasks: tasks)
            }
        }

        if let summaryData = applicationContext["summary"] as? Data,
           let summary = try? decoder.decode(WatchSummary.self, from: summaryData) {
            DispatchQueue.main.async { [weak self] in
                self?.cacheData(summary: summary)
            }
        }

        // Receive auth token from phone
        if let token = applicationContext["auth_token"] as? String {
            Task {
                await APIClient.shared.storeAuthToken(token)
            }
        }
    }

    /// Handles direct messages from the iPhone app.
    func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any]
    ) {
        session(session, didReceiveApplicationContext: message)
    }
}
