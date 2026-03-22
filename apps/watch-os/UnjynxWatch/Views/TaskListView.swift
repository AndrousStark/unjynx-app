import SwiftUI
import WatchKit

struct TaskListView: View {
    @EnvironmentObject private var viewModel: WatchViewModel

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.tasks.isEmpty {
                    loadingView
                } else if viewModel.isEmpty {
                    emptyStateView
                } else {
                    taskListContent
                }
            }
            .navigationTitle("UNJYNX")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    taskCountBadge
                }
            }
        }
    }

    // MARK: - Task List

    private var taskListContent: some View {
        List {
            ForEach(viewModel.tasks) { task in
                NavigationLink(value: task) {
                    TaskRowView(task: task)
                }
                .listRowBackground(Color.unjynxDeepPurple.opacity(0.6))
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    completeSwipeButton(for: task)
                }
                .swipeActions(edge: .leading, allowsFullSwipe: false) {
                    snoozeSwipeButton(for: task)
                }
            }

            if let error = viewModel.errorMessage {
                errorBanner(error)
            }
        }
        .listStyle(.carousel)
        .navigationDestination(for: WatchTask.self) { task in
            TaskDetailView(task: task)
        }
    }

    // MARK: - Swipe Actions

    private func completeSwipeButton(for task: WatchTask) -> some View {
        Button {
            WKInterfaceDevice.current().play(.success)
            Task {
                await viewModel.completeTask(task)
            }
        } label: {
            Label("Done", systemImage: "checkmark.circle.fill")
        }
        .tint(.unjynxEmerald)
    }

    private func snoozeSwipeButton(for task: WatchTask) -> some View {
        Button {
            WKInterfaceDevice.current().play(.retry)
            Task {
                await viewModel.snoozeTask(task, duration: .oneHour)
            }
        } label: {
            Label("Snooze", systemImage: "clock.badge.questionmark")
        }
        .tint(.unjynxAmber)
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 40))
                .foregroundStyle(.unjynxGold)

            Text("All clear!")
                .font(.headline)
                .foregroundStyle(.white)

            Text("No tasks remaining")
                .font(.caption2)
                .foregroundStyle(.unjynxMutedText)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.unjynxMidnight)
    }

    // MARK: - Loading State

    private var loadingView: some View {
        VStack(spacing: 8) {
            ProgressView()
                .tint(.unjynxViolet)

            Text("Loading...")
                .font(.caption2)
                .foregroundStyle(.unjynxMutedText)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.unjynxMidnight)
    }

    // MARK: - Badge & Error

    private var taskCountBadge: some View {
        Group {
            if viewModel.remainingTaskCount > 0 {
                Text("\(viewModel.remainingTaskCount)")
                    .font(.caption2.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.unjynxGold, in: Capsule())
            }
        }
    }

    private func errorBanner(_ message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.unjynxAmber)
                .font(.caption2)

            Text(message)
                .font(.caption2)
                .foregroundStyle(.unjynxAmber)
                .lineLimit(2)
        }
        .listRowBackground(Color.unjynxRose.opacity(0.15))
        .onTapGesture {
            viewModel.dismissError()
        }
    }
}

// MARK: - Task Row

struct TaskRowView: View {
    let task: WatchTask

    var body: some View {
        HStack(spacing: 8) {
            // Priority indicator dot
            Circle()
                .fill(task.priority.color)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.system(.body, design: .rounded, weight: .medium))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                if let dueTime = task.formattedDueTime {
                    Text(dueTime)
                        .font(.caption2)
                        .foregroundStyle(task.isOverdue ? .unjynxRose : .unjynxMutedText)
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    TaskListView()
        .environmentObject(WatchViewModel())
}
