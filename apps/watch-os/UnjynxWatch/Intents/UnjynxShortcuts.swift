import AppIntents

// MARK: - Create Task Intent

/// Siri Shortcut: "Create a task in UNJYNX"
struct CreateTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Create UNJYNX Task"
    static var description: IntentDescription = "Create a new task in UNJYNX"
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Task Title")
    var taskTitle: String

    @Parameter(title: "Priority", default: "none")
    var priority: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        do {
            try await APIClient.shared.post(
                "/api/v1/tasks",
                body: [
                    "title": taskTitle,
                    "priority": priority,
                ]
            )
            return .result(dialog: "Created task: \(taskTitle)")
        } catch {
            return .result(dialog: "Failed to create task. Please try again.")
        }
    }

    static var parameterSummary: some ParameterSummary {
        Summary("Create \(\.$taskTitle) with \(\.$priority) priority")
    }
}

// MARK: - Complete Task Intent

/// Siri Shortcut: "Complete my next task in UNJYNX"
struct CompleteNextTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Next Task"
    static var description: IntentDescription = "Mark the next task as completed"
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        do {
            let data = try await APIClient.shared.get("/api/v1/tasks?limit=1&status=pending")
            if let tasks = data["data"] as? [[String: Any]],
               let first = tasks.first,
               let taskId = first["id"] as? String,
               let title = first["title"] as? String {
                try await APIClient.shared.post("/api/v1/tasks/\(taskId)/complete", body: [:])
                return .result(dialog: "Completed: \(title)")
            }
            return .result(dialog: "No pending tasks found.")
        } catch {
            return .result(dialog: "Failed to complete task.")
        }
    }
}

// MARK: - Show Today's Tasks Intent

/// Siri Shortcut: "What are my tasks today?"
struct ShowTodayTasksIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Today's Tasks"
    static var description: IntentDescription = "List your tasks for today"
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        do {
            let now = ISO8601DateFormatter().string(from: Date())
            let data = try await APIClient.shared.get(
                "/api/v1/tasks/calendar?start=\(now.prefix(10))T00:00:00Z&end=\(now.prefix(10))T23:59:59Z"
            )
            if let tasks = data["data"] as? [[String: Any]] {
                if tasks.isEmpty {
                    return .result(dialog: "You have no tasks due today. Enjoy your free time!")
                }
                let titles = tasks.prefix(5).compactMap { $0["title"] as? String }
                let list = titles.enumerated()
                    .map { "\($0.offset + 1). \($0.element)" }
                    .joined(separator: "\n")
                return .result(dialog: "You have \(tasks.count) tasks today:\n\(list)")
            }
            return .result(dialog: "Couldn't load today's tasks.")
        } catch {
            return .result(dialog: "Failed to load tasks.")
        }
    }
}

// MARK: - Check Streak Intent

/// Siri Shortcut: "What's my UNJYNX streak?"
struct CheckStreakIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Streak"
    static var description: IntentDescription = "See your current productivity streak"
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        do {
            let data = try await APIClient.shared.get("/api/v1/progress/streak")
            if let streak = data["data"] as? [String: Any],
               let current = streak["currentStreak"] as? Int,
               let longest = streak["longestStreak"] as? Int {
                if current > 0 {
                    return .result(dialog: "You're on a \(current)-day streak! Your longest is \(longest) days. Keep it up! 🔥")
                }
                return .result(dialog: "No active streak. Complete a task to start one!")
            }
            return .result(dialog: "Couldn't load streak data.")
        } catch {
            return .result(dialog: "Failed to check streak.")
        }
    }
}

// MARK: - App Shortcuts Provider

/// Registers shortcuts that appear in the Shortcuts app and Siri suggestions.
struct UnjynxShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CreateTaskIntent(),
            phrases: [
                "Create a task in \(.applicationName)",
                "Add task to \(.applicationName)",
                "New \(.applicationName) task",
            ],
            shortTitle: "Create Task",
            systemImageName: "plus.circle"
        )

        AppShortcut(
            intent: CompleteNextTaskIntent(),
            phrases: [
                "Complete my next \(.applicationName) task",
                "Mark task done in \(.applicationName)",
                "Finish task in \(.applicationName)",
            ],
            shortTitle: "Complete Task",
            systemImageName: "checkmark.circle"
        )

        AppShortcut(
            intent: ShowTodayTasksIntent(),
            phrases: [
                "What are my \(.applicationName) tasks",
                "Show today's tasks in \(.applicationName)",
                "My \(.applicationName) schedule",
            ],
            shortTitle: "Today's Tasks",
            systemImageName: "list.bullet"
        )

        AppShortcut(
            intent: CheckStreakIntent(),
            phrases: [
                "What's my \(.applicationName) streak",
                "Check \(.applicationName) streak",
                "My productivity streak",
            ],
            shortTitle: "Check Streak",
            systemImageName: "flame"
        )
    }
}
