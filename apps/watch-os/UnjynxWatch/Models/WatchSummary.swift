import Foundation

struct WatchSummary: Codable, Equatable {
    /// Tasks completed percentage (0.0 to 1.0).
    let tasksCompleted: Double

    /// Focus minutes percentage (0.0 to 1.0).
    let focusMinutes: Double

    /// Habits completed percentage (0.0 to 1.0).
    let habitsCompleted: Double

    /// Current streak in days.
    let streakDays: Int

    /// Best streak ever achieved in days.
    let bestStreak: Int

    /// Title of the next upcoming task, if any.
    let nextTask: String?

    /// Total number of tasks for today.
    let totalTasks: Int

    /// Number of tasks completed today.
    let completedTasks: Int

    static let empty = WatchSummary(
        tasksCompleted: 0,
        focusMinutes: 0,
        habitsCompleted: 0,
        streakDays: 0,
        bestStreak: 0,
        nextTask: nil,
        totalTasks: 0,
        completedTasks: 0
    )

    /// Overall productivity score averaging the three ring values.
    var overallProgress: Double {
        (tasksCompleted + focusMinutes + habitsCompleted) / 3.0
    }

    /// Formatted overall percentage string (e.g., "72%").
    var overallPercentageText: String {
        "\(Int(overallProgress * 100))%"
    }
}
