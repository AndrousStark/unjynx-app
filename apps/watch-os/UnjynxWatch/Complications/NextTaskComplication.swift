import WidgetKit
import SwiftUI

// MARK: - Next Task Complication

/// Displays the next upcoming task title and due time in a rectangular complication.
struct NextTaskComplication: Widget {
    let kind = "com.metaminds.unjynx.complication.next-task"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: NextTaskTimelineProvider()
        ) { entry in
            NextTaskEntryView(entry: entry)
                .containerBackground(.unjynxMidnight, for: .widget)
        }
        .configurationDisplayName("Next Task")
        .description("Shows your next upcoming task.")
        .supportedFamilies([.accessoryRectangular])
    }
}

// MARK: - Timeline Entry

struct NextTaskEntry: TimelineEntry {
    let date: Date
    let taskTitle: String?
    let dueTime: String?
    let priority: WatchTask.TaskPriority
}

// MARK: - Timeline Provider

struct NextTaskTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextTaskEntry {
        NextTaskEntry(
            date: .now,
            taskTitle: "Review quarterly report",
            dueTime: "2:30 PM",
            priority: .high
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (NextTaskEntry) -> Void) {
        let entry = NextTaskEntry(
            date: .now,
            taskTitle: "Team standup meeting",
            dueTime: "10:00 AM",
            priority: .medium
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NextTaskEntry>) -> Void) {
        Task {
            let entry: NextTaskEntry

            do {
                let tasks = try await APIClient.shared.getTasks()
                let nextTask = tasks
                    .filter { !$0.isCompleted }
                    .sorted { ($0.dueDate ?? .distantFuture) < ($1.dueDate ?? .distantFuture) }
                    .first

                entry = NextTaskEntry(
                    date: .now,
                    taskTitle: nextTask?.title,
                    dueTime: nextTask?.formattedDueTime,
                    priority: nextTask?.priority ?? .none
                )
            } catch {
                let cached = ConnectivityManager.shared.cachedTasks
                    .filter { !$0.isCompleted }
                    .sorted { ($0.dueDate ?? .distantFuture) < ($1.dueDate ?? .distantFuture) }
                    .first

                entry = NextTaskEntry(
                    date: .now,
                    taskTitle: cached?.title,
                    dueTime: cached?.formattedDueTime,
                    priority: cached?.priority ?? .none
                )
            }

            let nextUpdate = Calendar.current.date(
                byAdding: .hour, value: 1, to: .now
            ) ?? .now.addingTimeInterval(3600)

            let timeline = Timeline(
                entries: [entry],
                policy: .after(nextUpdate)
            )
            completion(timeline)
        }
    }
}

// MARK: - Entry View

struct NextTaskEntryView: View {
    let entry: NextTaskEntry

    var body: some View {
        if let title = entry.taskTitle {
            HStack(spacing: 6) {
                // Priority bar
                RoundedRectangle(cornerRadius: 2)
                    .fill(entry.priority.color)
                    .frame(width: 3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(.caption, design: .rounded, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    if let dueTime = entry.dueTime {
                        HStack(spacing: 3) {
                            Image(systemName: "clock")
                                .font(.system(size: 8))
                            Text(dueTime)
                                .font(.system(size: 10, weight: .medium))
                        }
                        .foregroundStyle(.unjynxMutedText)
                    }
                }

                Spacer()
            }
        } else {
            // No tasks
            HStack(spacing: 6) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.caption)
                    .foregroundStyle(.unjynxGold)

                Text("All clear!")
                    .font(.system(.caption, design: .rounded, weight: .medium))
                    .foregroundStyle(.unjynxMutedText)
            }
        }
    }
}

#Preview(as: .accessoryRectangular) {
    NextTaskComplication()
} timeline: {
    NextTaskEntry(
        date: .now,
        taskTitle: "Review quarterly report and prepare summary",
        dueTime: "2:30 PM",
        priority: .high
    )
    NextTaskEntry(
        date: .now,
        taskTitle: nil,
        dueTime: nil,
        priority: .none
    )
}
