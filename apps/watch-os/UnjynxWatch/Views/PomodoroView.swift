import SwiftUI
import WatchKit

/// Pomodoro focus timer for Apple Watch.
///
/// Shows a circular countdown ring with session tracking.
/// Haptic feedback at session end. Syncs state with the phone app.
struct PomodoroView: View {
    @StateObject private var timer = PomodoroTimer()

    var body: some View {
        VStack(spacing: 8) {
            // Timer ring
            ZStack {
                // Background ring
                Circle()
                    .stroke(Color.unjynxDeepPurple, lineWidth: 8)
                    .frame(width: 120, height: 120)

                // Progress ring
                Circle()
                    .trim(from: 0, to: timer.progress)
                    .stroke(
                        timer.isBreak ? Color.unjynxEmerald : Color.unjynxGold,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 1), value: timer.progress)

                // Time display
                VStack(spacing: 2) {
                    Text(timer.timeString)
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text(timer.phaseLabel)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(timer.isBreak ? .unjynxEmerald : .unjynxGold)
                }
            }

            // Session dots
            HStack(spacing: 6) {
                ForEach(0..<4, id: \.self) { i in
                    Circle()
                        .fill(i < timer.completedSessions ? Color.unjynxGold : Color.unjynxDeepPurple)
                        .frame(width: 8, height: 8)
                }
            }
            .padding(.top, 4)

            // Controls
            HStack(spacing: 20) {
                // Reset
                Button(action: { timer.reset() }) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.system(size: 16))
                        .foregroundColor(.unjynxMutedText)
                }
                .buttonStyle(.plain)

                // Play/Pause
                Button(action: { timer.toggle() }) {
                    Image(systemName: timer.isRunning ? "pause.fill" : "play.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.unjynxGold)
                }
                .buttonStyle(.plain)

                // Skip
                Button(action: { timer.skip() }) {
                    Image(systemName: "forward.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.unjynxMutedText)
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 4)
        }
        .background(Color.unjynxMidnight)
    }
}

// MARK: - Pomodoro Timer Model

class PomodoroTimer: ObservableObject {
    @Published var remainingSeconds: Int = 25 * 60
    @Published var isRunning = false
    @Published var isBreak = false
    @Published var completedSessions = 0

    private let workDuration = 25 * 60
    private let shortBreakDuration = 5 * 60
    private let longBreakDuration = 15 * 60
    private var timer: Timer?

    var progress: Double {
        let total = isBreak
            ? (completedSessions % 4 == 0 ? longBreakDuration : shortBreakDuration)
            : workDuration
        return Double(total - remainingSeconds) / Double(total)
    }

    var timeString: String {
        let m = remainingSeconds / 60
        let s = remainingSeconds % 60
        return String(format: "%02d:%02d", m, s)
    }

    var phaseLabel: String {
        if isBreak {
            return completedSessions % 4 == 0 ? "Long Break" : "Short Break"
        }
        return "Focus \(completedSessions + 1)/4"
    }

    func toggle() {
        if isRunning {
            pause()
        } else {
            start()
        }
    }

    func start() {
        isRunning = true
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if self.remainingSeconds > 0 {
                self.remainingSeconds -= 1
            } else {
                self.sessionComplete()
            }
        }
    }

    func pause() {
        isRunning = false
        timer?.invalidate()
        timer = nil
    }

    func reset() {
        pause()
        remainingSeconds = workDuration
        isBreak = false
    }

    func skip() {
        sessionComplete()
    }

    private func sessionComplete() {
        pause()

        // Haptic feedback
        WKInterfaceDevice.current().play(.success)

        if isBreak {
            // Break over, start new work session
            isBreak = false
            remainingSeconds = workDuration
        } else {
            // Work session complete
            completedSessions += 1
            isBreak = true
            remainingSeconds = completedSessions % 4 == 0
                ? longBreakDuration
                : shortBreakDuration
        }
    }
}
