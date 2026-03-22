import SwiftUI

struct ProgressRingsView: View {
    @EnvironmentObject private var viewModel: WatchViewModel
    @State private var animateRings = false
    @State private var crownValue: Double = 0

    var body: some View {
        VStack(spacing: 4) {
            // Rings
            ZStack {
                // Outer ring: Tasks (gold)
                ProgressRing(
                    progress: animateRings ? viewModel.summary.tasksCompleted : 0,
                    lineWidth: 10,
                    color: .unjynxGold,
                    radius: 58
                )

                // Middle ring: Focus (violet)
                ProgressRing(
                    progress: animateRings ? viewModel.summary.focusMinutes : 0,
                    lineWidth: 10,
                    color: .unjynxViolet,
                    radius: 44
                )

                // Inner ring: Habits (emerald)
                ProgressRing(
                    progress: animateRings ? viewModel.summary.habitsCompleted : 0,
                    lineWidth: 10,
                    color: .unjynxEmerald,
                    radius: 30
                )

                // Center percentage
                VStack(spacing: 0) {
                    Text(viewModel.summary.overallPercentageText)
                        .font(.system(.title2, design: .rounded, weight: .bold))
                        .foregroundStyle(.white)
                        .contentTransition(.numericText())
                }
            }
            .frame(height: 140)

            // Legend
            HStack(spacing: 12) {
                RingLegendItem(
                    color: .unjynxGold,
                    label: "Tasks",
                    value: viewModel.summary.tasksCompleted
                )

                RingLegendItem(
                    color: .unjynxViolet,
                    label: "Focus",
                    value: viewModel.summary.focusMinutes
                )

                RingLegendItem(
                    color: .unjynxEmerald,
                    label: "Habits",
                    value: viewModel.summary.habitsCompleted
                )
            }
            .padding(.top, 4)
        }
        .padding(.horizontal, 4)
        .background(Color.unjynxMidnight)
        .focusable()
        .digitalCrownRotation(
            $crownValue,
            from: 0,
            through: 100,
            sensitivity: .low,
            isContinuous: false,
            isHapticFeedbackEnabled: true
        )
        .onAppear {
            withAnimation(.spring(response: 1.0, dampingFraction: 0.7)) {
                animateRings = true
            }
        }
        .onDisappear {
            animateRings = false
        }
    }
}

// MARK: - Progress Ring Shape

struct ProgressRing: View {
    let progress: Double
    let lineWidth: CGFloat
    let color: Color
    let radius: CGFloat

    var body: some View {
        ZStack {
            // Background track
            Circle()
                .stroke(
                    color.opacity(0.15),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .frame(width: radius * 2, height: radius * 2)

            // Foreground progress
            Circle()
                .trim(from: 0, to: CGFloat(min(progress, 1.0)))
                .stroke(
                    color,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .frame(width: radius * 2, height: radius * 2)
                .rotationEffect(.degrees(-90))
                .animation(
                    .spring(response: 1.0, dampingFraction: 0.7),
                    value: progress
                )

            // End cap glow when near complete
            if progress > 0.9 {
                Circle()
                    .trim(from: CGFloat(min(progress, 1.0)) - 0.01, to: CGFloat(min(progress, 1.0)))
                    .stroke(
                        color,
                        style: StrokeStyle(lineWidth: lineWidth + 2, lineCap: .round)
                    )
                    .frame(width: radius * 2, height: radius * 2)
                    .rotationEffect(.degrees(-90))
                    .blur(radius: 4)
                    .opacity(0.6)
            }
        }
    }
}

// MARK: - Legend Item

struct RingLegendItem: View {
    let color: Color
    let label: String
    let value: Double

    var body: some View {
        VStack(spacing: 2) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)

            Text(label)
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(.unjynxMutedText)

            Text("\(Int(value * 100))%")
                .font(.system(size: 10, design: .rounded, weight: .bold))
                .foregroundStyle(.white)
        }
    }
}

#Preview {
    ProgressRingsView()
        .environmentObject(WatchViewModel())
}
