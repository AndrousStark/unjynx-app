import Foundation
import SwiftUI
import Combine

// MARK: - Watch ViewModel

@MainActor
final class WatchViewModel: ObservableObject {
    // MARK: Published State

    @Published private(set) var tasks: [WatchTask] = []
    @Published private(set) var summary: WatchSummary = .empty
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    // MARK: Dependencies

    private let connectivity = ConnectivityManager.shared
    private var refreshTimer: Timer?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Lifecycle

    init() {
        observeConnectivityUpdates()
    }

    deinit {
        refreshTimer?.invalidate()
    }

    // MARK: - Data Loading

    /// Refreshes all data from the best available source.
    func refresh() async {
        guard !isLoading else { return }

        isLoading = true
        errorMessage = nil

        async let fetchedTasks = connectivity.fetchTasks()
        async let fetchedSummary = connectivity.fetchSummary()

        let (newTasks, newSummary) = await (fetchedTasks, fetchedSummary)
        tasks = newTasks
        summary = newSummary
        isLoading = false
    }

    /// Called when the view appears. Loads data and starts the refresh timer.
    func onAppear() async {
        await refresh()
        startAutoRefresh()
    }

    /// Called when the view disappears. Stops the refresh timer.
    func onDisappear() {
        stopAutoRefresh()
    }

    // MARK: - Task Actions

    /// Completes a task with optimistic update and rollback on failure.
    func completeTask(_ task: WatchTask) async {
        // Optimistic update: remove from list immediately
        let originalTasks = tasks
        let originalSummary = summary

        tasks.removeAll { $0.id == task.id }

        // Update summary optimistically
        let newCompleted = summary.completedTasks + 1
        let newTotal = max(summary.totalTasks, 1)
        let newPercentage = Double(newCompleted) / Double(newTotal)

        summary = WatchSummary(
            tasksCompleted: min(newPercentage, 1.0),
            focusMinutes: summary.focusMinutes,
            habitsCompleted: summary.habitsCompleted,
            streakDays: summary.streakDays,
            bestStreak: summary.bestStreak,
            nextTask: tasks.first?.title,
            totalTasks: summary.totalTasks,
            completedTasks: newCompleted
        )

        // Sync to phone via WatchConnectivity
        connectivity.sendCompleteAction(taskId: task.id)

        // Also sync via API as backup
        do {
            try await APIClient.shared.completeTask(task.id)
        } catch {
            // Rollback on failure
            tasks = originalTasks
            summary = originalSummary
            errorMessage = "Failed to complete task. Please try again."
        }
    }

    /// Snoozes a task with optimistic removal and rollback on failure.
    func snoozeTask(_ task: WatchTask, duration: SnoozeDuration) async {
        let originalTasks = tasks

        // Optimistic: remove from current list (it's snoozed away)
        tasks.removeAll { $0.id == task.id }

        // Sync via WatchConnectivity
        connectivity.sendSnoozeAction(taskId: task.id, minutes: duration.minutes)

        // Sync via API
        do {
            try await APIClient.shared.snoozeTask(task.id, minutes: duration.minutes)
        } catch {
            // Rollback
            tasks = originalTasks
            errorMessage = "Failed to snooze task. Please try again."
        }
    }

    /// Clears the current error message.
    func dismissError() {
        errorMessage = nil
    }

    // MARK: - Computed Properties

    /// The number of remaining (incomplete) tasks.
    var remainingTaskCount: Int {
        tasks.filter { !$0.isCompleted }.count
    }

    /// Whether there are no tasks to show.
    var isEmpty: Bool {
        tasks.isEmpty && !isLoading
    }

    // MARK: - Auto Refresh

    private func startAutoRefresh() {
        refreshTimer?.invalidate()

        // Refresh every 5 minutes
        refreshTimer = Timer.scheduledTimer(
            withTimeInterval: 300,
            repeats: true
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.refresh()
            }
        }
    }

    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }

    // MARK: - Observe Connectivity

    private func observeConnectivityUpdates() {
        // When connectivity pushes new cached tasks, update our state
        connectivity.$cachedTasks
            .receive(on: DispatchQueue.main)
            .sink { [weak self] newTasks in
                guard let self, !newTasks.isEmpty else { return }
                self.tasks = newTasks
            }
            .store(in: &cancellables)

        connectivity.$cachedSummary
            .receive(on: DispatchQueue.main)
            .sink { [weak self] newSummary in
                guard let self else { return }
                self.summary = newSummary
            }
            .store(in: &cancellables)
    }
}
