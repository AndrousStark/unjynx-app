import WidgetKit
import SwiftUI

// MARK: - Streak Complication

/// Displays the current streak with a flame icon in a circular complication.
struct StreakComplication: Widget {
    let kind = "com.metaminds.unjynx.complication.streak"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: StreakTimelineProvider()
        ) { entry in
            StreakEntryView(entry: entry)
                .containerBackground(.unjynxMidnight, for: .widget)
        }
        .configurationDisplayName("Streak")
        .description("Shows your current productivity streak.")
        .supportedFamilies([.accessoryCircular])
    }
}

// MARK: - Timeline Entry

struct StreakEntry: TimelineEntry {
    let date: Date
    let streakDays: Int
}

// MARK: - Timeline Provider

struct StreakTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> StreakEntry {
        StreakEntry(date: .now, streakDays: 12)
    }

    func getSnapshot(in context: Context, completion: @escaping (StreakEntry) -> Void) {
        let entry = StreakEntry(date: .now, streakDays: 7)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StreakEntry>) -> Void) {
        Task {
            let streakDays: Int
            do {
                let summary = try await APIClient.shared.getSummary()
                streakDays = summary.streakDays
            } catch {
                streakDays = ConnectivityManager.shared.cachedSummary.streakDays
            }

            let entry = StreakEntry(date: .now, streakDays: streakDays)

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

struct StreakEntryView: View {
    let entry: StreakEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
                .opacity(0.3)

            VStack(spacing: 1) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(.unjynxGold)

                Text("\(entry.streakDays)")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(.unjynxGold)

                Text("days")
                    .font(.system(size: 7, weight: .medium))
                    .foregroundStyle(.unjynxMutedText)
                    .textCase(.uppercase)
            }
        }
        .widgetAccentable()
    }
}

#Preview(as: .accessoryCircular) {
    StreakComplication()
} timeline: {
    StreakEntry(date: .now, streakDays: 42)
    StreakEntry(date: .now, streakDays: 1)
}
