import WidgetKit
import SwiftUI

// MARK: - Tasks Left Complication

/// Displays the number of remaining tasks in a circular complication.
struct TasksLeftComplication: Widget {
    let kind = "com.metaminds.unjynx.complication.tasks-left"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: TasksLeftTimelineProvider()
        ) { entry in
            TasksLeftEntryView(entry: entry)
                .containerBackground(.unjynxMidnight, for: .widget)
        }
        .configurationDisplayName("Tasks Left")
        .description("Shows remaining tasks for today.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Timeline Entry

struct TasksLeftEntry: TimelineEntry {
    let date: Date
    let tasksRemaining: Int
}

// MARK: - Timeline Provider

struct TasksLeftTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> TasksLeftEntry {
        TasksLeftEntry(date: .now, tasksRemaining: 5)
    }

    func getSnapshot(in context: Context, completion: @escaping (TasksLeftEntry) -> Void) {
        let entry = TasksLeftEntry(date: .now, tasksRemaining: 3)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TasksLeftEntry>) -> Void) {
        Task {
            let count: Int
            do {
                let tasks = try await APIClient.shared.getTasks()
                count = tasks.filter { !$0.isCompleted }.count
            } catch {
                // Fall back to cached data
                count = ConnectivityManager.shared.cachedTasks
                    .filter { !$0.isCompleted }.count
            }

            let entry = TasksLeftEntry(date: .now, tasksRemaining: count)

            // Refresh every hour (battery-friendly)
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

struct TasksLeftEntryView: View {
    let entry: TasksLeftEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
                .opacity(0.3)

            VStack(spacing: 0) {
                Text("\(entry.tasksRemaining)")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(.unjynxGold)

                Text("tasks")
                    .font(.system(size: 8, weight: .medium))
                    .foregroundStyle(.unjynxMutedText)
                    .textCase(.uppercase)
            }
        }
        .widgetAccentable()
    }
}

#Preview(as: .accessoryCircular) {
    TasksLeftComplication()
} timeline: {
    TasksLeftEntry(date: .now, tasksRemaining: 7)
    TasksLeftEntry(date: .now, tasksRemaining: 3)
    TasksLeftEntry(date: .now, tasksRemaining: 0)
}
