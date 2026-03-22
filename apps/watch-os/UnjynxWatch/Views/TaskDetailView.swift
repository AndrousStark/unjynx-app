import SwiftUI
import WatchKit

struct TaskDetailView: View {
    @EnvironmentObject private var viewModel: WatchViewModel
    @Environment(\.dismiss) private var dismiss

    let task: WatchTask
    @State private var showSnoozeOptions = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                // Title
                Text(task.title)
                    .font(.system(.title3, design: .rounded, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // Priority badge
                priorityBadge

                // Due date
                if let dueTime = task.formattedDueTime {
                    dueDateRow(dueTime)
                }

                Divider()
                    .background(Color.unjynxViolet.opacity(0.3))

                // Complete button
                completeButton

                // Snooze button
                snoozeButton

                // Snooze options
                if showSnoozeOptions {
                    snoozePicker
                }
            }
            .padding(.horizontal, 4)
        }
        .background(Color.unjynxMidnight)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Priority Badge

    private var priorityBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: task.priority.sfSymbol)
                .font(.caption2)

            Text(task.priority.label)
                .font(.caption2.weight(.semibold))
        }
        .foregroundStyle(task.priority.color)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            task.priority.color.opacity(0.15),
            in: Capsule()
        )
    }

    // MARK: - Due Date Row

    private func dueDateRow(_ dueTime: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "clock")
                .font(.caption2)
                .foregroundStyle(.unjynxLavender)

            Text(dueTime)
                .font(.caption)
                .foregroundStyle(task.isOverdue ? .unjynxRose : .unjynxLavender)
        }
    }

    // MARK: - Complete Button

    private var completeButton: some View {
        Button {
            WKInterfaceDevice.current().play(.success)
            Task {
                await viewModel.completeTask(task)
                dismiss()
            }
        } label: {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                Text("Complete")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
        .buttonStyle(.borderedProminent)
        .tint(.unjynxGold)
        .foregroundStyle(.black)
    }

    // MARK: - Snooze Button

    private var snoozeButton: some View {
        Button {
            WKInterfaceDevice.current().play(.click)
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                showSnoozeOptions.toggle()
            }
        } label: {
            HStack {
                Image(systemName: "clock.badge.questionmark")
                Text("Snooze")
                    .fontWeight(.medium)
                Image(systemName: showSnoozeOptions
                    ? "chevron.up"
                    : "chevron.down"
                )
                .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
        .buttonStyle(.bordered)
        .tint(.unjynxAmber)
    }

    // MARK: - Snooze Picker

    private var snoozePicker: some View {
        VStack(spacing: 6) {
            ForEach(SnoozeDuration.allCases) { duration in
                Button {
                    WKInterfaceDevice.current().play(.retry)
                    Task {
                        await viewModel.snoozeTask(task, duration: duration)
                        dismiss()
                    }
                } label: {
                    HStack {
                        Image(systemName: duration.sfSymbol)
                            .font(.caption2)
                        Text(duration.label)
                            .font(.caption)
                        Spacer()
                    }
                    .padding(.vertical, 6)
                    .padding(.horizontal, 10)
                }
                .buttonStyle(.bordered)
                .tint(.unjynxDeepPurple)
            }
        }
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}

#Preview {
    NavigationStack {
        TaskDetailView(task: WatchTask(
            id: "1",
            title: "Review quarterly report and prepare summary",
            dueDate: Date().addingTimeInterval(3600),
            priority: .high,
            isCompleted: false,
            projectColor: nil
        ))
        .environmentObject(WatchViewModel())
    }
}
