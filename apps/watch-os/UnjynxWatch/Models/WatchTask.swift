import SwiftUI

struct WatchTask: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let dueDate: Date?
    let priority: TaskPriority
    let isCompleted: Bool
    let projectColor: String?

    enum TaskPriority: String, Codable, CaseIterable {
        case urgent
        case high
        case medium
        case low
        case none

        var color: Color {
            switch self {
            case .urgent: return .unjynxRose
            case .high: return .orange
            case .medium: return .unjynxAmber
            case .low: return .gray
            case .none: return .clear
            }
        }

        var label: String {
            switch self {
            case .urgent: return "Urgent"
            case .high: return "High"
            case .medium: return "Medium"
            case .low: return "Low"
            case .none: return "None"
            }
        }

        var sfSymbol: String {
            switch self {
            case .urgent: return "exclamationmark.triangle.fill"
            case .high: return "arrow.up.circle.fill"
            case .medium: return "minus.circle.fill"
            case .low: return "arrow.down.circle.fill"
            case .none: return "circle"
            }
        }
    }

    /// Returns a formatted relative due time string.
    var formattedDueTime: String? {
        guard let dueDate else { return nil }

        let now = Date()
        let calendar = Calendar.current

        if calendar.isDateInToday(dueDate) {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            return formatter.string(from: dueDate)
        }

        if calendar.isDateInTomorrow(dueDate) {
            return "Tomorrow"
        }

        if dueDate < now {
            return "Overdue"
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, h:mm a"
        return formatter.string(from: dueDate)
    }

    /// Whether this task is overdue.
    var isOverdue: Bool {
        guard let dueDate else { return false }
        return dueDate < Date() && !isCompleted
    }
}

// MARK: - Snooze Duration

enum SnoozeDuration: CaseIterable, Identifiable {
    case thirtyMinutes
    case oneHour
    case twoHours
    case tomorrow

    var id: String { label }

    var label: String {
        switch self {
        case .thirtyMinutes: return "30 min"
        case .oneHour: return "1 hour"
        case .twoHours: return "2 hours"
        case .tomorrow: return "Tomorrow"
        }
    }

    var minutes: Int {
        switch self {
        case .thirtyMinutes: return 30
        case .oneHour: return 60
        case .twoHours: return 120
        case .tomorrow: return 1440
        }
    }

    var sfSymbol: String {
        switch self {
        case .thirtyMinutes: return "clock.badge.questionmark"
        case .oneHour: return "clock"
        case .twoHours: return "clock.arrow.2.circlepath"
        case .tomorrow: return "sunrise"
        }
    }
}
