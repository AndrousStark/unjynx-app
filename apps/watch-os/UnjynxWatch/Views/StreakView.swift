import SwiftUI

struct StreakView: View {
    @EnvironmentObject private var viewModel: WatchViewModel
    @State private var flamePulse = false
    @State private var flameScale: CGFloat = 1.0

    var body: some View {
        VStack(spacing: 8) {
            Spacer()

            // Flame icon with pulse animation
            flameIcon

            // Streak number
            Text("\(viewModel.summary.streakDays)")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundStyle(
                    LinearGradient.unjynxGoldShimmer
                )
                .contentTransition(.numericText())

            Text("day streak")
                .font(.system(.caption, design: .rounded, weight: .medium))
                .foregroundStyle(.unjynxMutedText)
                .textCase(.uppercase)
                .tracking(1.5)

            Spacer()

            // Best streak
            bestStreakBadge

            // Next task hint
            if let nextTask = viewModel.summary.nextTask {
                nextTaskHint(nextTask)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.unjynxMidnight)
        .onAppear {
            startFlameAnimation()
        }
    }

    // MARK: - Flame Icon

    private var flameIcon: some View {
        Image(systemName: "flame.fill")
            .font(.system(size: 36))
            .foregroundStyle(
                LinearGradient.unjynxFlame
            )
            .shadow(color: .unjynxGold.opacity(0.4), radius: 8, y: 2)
            .scaleEffect(flameScale)
            .animation(
                .easeInOut(duration: 1.2).repeatForever(autoreverses: true),
                value: flamePulse
            )
    }

    // MARK: - Best Streak Badge

    private var bestStreakBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 10))
                .foregroundStyle(.unjynxAmber)

            Text("Best: \(viewModel.summary.bestStreak) days")
                .font(.system(.caption2, design: .rounded))
                .foregroundStyle(.unjynxMutedText)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(
            Color.unjynxDeepPurple.opacity(0.6),
            in: Capsule()
        )
    }

    // MARK: - Next Task Hint

    private func nextTaskHint(_ title: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: "arrow.right.circle")
                .font(.system(size: 9))
                .foregroundStyle(.unjynxViolet)

            Text(title)
                .font(.system(size: 10))
                .foregroundStyle(.unjynxLavender)
                .lineLimit(1)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
    }

    // MARK: - Animation

    private func startFlameAnimation() {
        flamePulse = true
        withAnimation(
            .easeInOut(duration: 1.2).repeatForever(autoreverses: true)
        ) {
            flameScale = 1.08
        }
    }
}

#Preview {
    StreakView()
        .environmentObject(WatchViewModel())
}
