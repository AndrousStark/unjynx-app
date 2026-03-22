import WidgetKit
import SwiftUI

// MARK: - Progress Rings Complication

/// Displays a mini ring gauge showing overall task completion in a corner complication.
struct ProgressRingsComplication: Widget {
    let kind = "com.metaminds.unjynx.complication.progress-rings"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: ProgressRingsTimelineProvider()
        ) { entry in
            ProgressRingsEntryView(entry: entry)
                .containerBackground(.unjynxMidnight, for: .widget)
        }
        .configurationDisplayName("Progress")
        .description("Shows overall daily progress as a ring gauge.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner])
    }
}

// MARK: - Timeline Entry

struct ProgressRingsEntry: TimelineEntry {
    let date: Date
    let tasksProgress: Double
    let focusProgress: Double
    let habitsProgress: Double
}

// MARK: - Timeline Provider

struct ProgressRingsTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressRingsEntry {
        ProgressRingsEntry(
            date: .now,
            tasksProgress: 0.65,
            focusProgress: 0.45,
            habitsProgress: 0.80
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ProgressRingsEntry) -> Void) {
        let entry = ProgressRingsEntry(
            date: .now,
            tasksProgress: 0.72,
            focusProgress: 0.55,
            habitsProgress: 0.90
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressRingsEntry>) -> Void) {
        Task {
            let entry: ProgressRingsEntry

            do {
                let summary = try await APIClient.shared.getSummary()
                entry = ProgressRingsEntry(
                    date: .now,
                    tasksProgress: summary.tasksCompleted,
                    focusProgress: summary.focusMinutes,
                    habitsProgress: summary.habitsCompleted
                )
            } catch {
                let cached = ConnectivityManager.shared.cachedSummary
                entry = ProgressRingsEntry(
                    date: .now,
                    tasksProgress: cached.tasksCompleted,
                    focusProgress: cached.focusMinutes,
                    habitsProgress: cached.habitsCompleted
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

struct ProgressRingsEntryView: View {
    let entry: ProgressRingsEntry

    private var overallProgress: Double {
        (entry.tasksProgress + entry.focusProgress + entry.habitsProgress) / 3.0
    }

    var body: some View {
        ZStack {
            // Outer ring (tasks - gold)
            Circle()
                .trim(from: 0, to: CGFloat(min(entry.tasksProgress, 1.0)))
                .stroke(
                    Color.unjynxGold,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .padding(1)

            // Middle ring (focus - violet)
            Circle()
                .trim(from: 0, to: CGFloat(min(entry.focusProgress, 1.0)))
                .stroke(
                    Color.unjynxViolet,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .padding(6)

            // Inner ring (habits - emerald)
            Circle()
                .trim(from: 0, to: CGFloat(min(entry.habitsProgress, 1.0)))
                .stroke(
                    Color.unjynxEmerald,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .padding(11)

            // Center text
            Text("\(Int(overallProgress * 100))")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
        .widgetAccentable()
    }
}

#Preview(as: .accessoryCircular) {
    ProgressRingsComplication()
} timeline: {
    ProgressRingsEntry(
        date: .now,
        tasksProgress: 0.75,
        focusProgress: 0.50,
        habitsProgress: 0.90
    )
    ProgressRingsEntry(
        date: .now,
        tasksProgress: 1.0,
        focusProgress: 1.0,
        habitsProgress: 1.0
    )
}
