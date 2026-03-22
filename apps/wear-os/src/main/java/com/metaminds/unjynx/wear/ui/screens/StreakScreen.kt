package com.metaminds.unjynx.wear.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.metaminds.unjynx.wear.data.DaySummary
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.UiState
import com.metaminds.unjynx.wear.ui.theme.UnjynxColors
import com.metaminds.unjynx.wear.ui.theme.UnjynxTypography
import androidx.wear.compose.material3.Text

/**
 * Streak screen — large streak number with animated flame icon.
 *
 * Designed as a motivational glanceable screen.
 * Features:
 * - Large gold streak count (Bebas Neue style)
 * - Pulsing/flickering flame emoji
 * - "Best: X days" subtitle
 * - Motivational text
 */
@Composable
fun StreakScreen(
    repository: TaskRepository,
    modifier: Modifier = Modifier,
) {
    val summaryState by repository.summary.collectAsState(initial = UiState.Loading)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(UnjynxColors.SurfaceBase),
        contentAlignment = Alignment.Center,
    ) {
        when (val state = summaryState) {
            is UiState.Loading -> {
                Text(
                    text = "...",
                    style = UnjynxTypography.titleMedium,
                    color = UnjynxColors.TextTertiary,
                )
            }
            is UiState.Error -> {
                Text(
                    text = state.message,
                    style = UnjynxTypography.bodySmall,
                    color = UnjynxColors.Error,
                )
            }
            is UiState.Success -> {
                StreakContent(summary = state.data)
            }
        }
    }
}

@Composable
private fun StreakContent(summary: DaySummary) {
    // Scale-in animation for the streak number
    val scaleAnim = remember { Animatable(0.5f) }
    LaunchedEffect(Unit) {
        scaleAnim.animateTo(
            targetValue = 1f,
            animationSpec = tween(
                durationMillis = 600,
                easing = FastOutSlowInEasing,
            ),
        )
    }

    // Flame flicker animation
    val infiniteTransition = rememberInfiniteTransition(label = "flame")
    val flameScale by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "flameScale",
    )
    val flameAlpha by infiniteTransition.animateFloat(
        initialValue = 0.7f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "flameAlpha",
    )
    val flameOffsetY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -3f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "flameOffsetY",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Animated flame icon
        Text(
            text = "\uD83D\uDD25", // Fire emoji
            fontSize = 36.sp,
            modifier = Modifier
                .scale(flameScale)
                .alpha(flameAlpha)
                .offset(y = flameOffsetY.dp),
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Large streak number
        Text(
            text = "${summary.currentStreak}",
            style = UnjynxTypography.displayLarge.copy(fontSize = 52.sp),
            color = UnjynxColors.ElectricGold,
            modifier = Modifier.scale(scaleAnim.value),
        )

        // "days" label
        Text(
            text = if (summary.currentStreak == 1) "day" else "days",
            style = UnjynxTypography.titleMedium,
            color = UnjynxColors.TextSecondary,
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Best streak
        if (summary.bestStreak > 0) {
            Text(
                text = "Best: ${summary.bestStreak} days",
                style = UnjynxTypography.bodySmall,
                color = UnjynxColors.VioletLight,
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Motivational text
        Text(
            text = motivationalText(summary.currentStreak),
            style = UnjynxTypography.bodySmall,
            color = UnjynxColors.TextTertiary,
            textAlign = TextAlign.Center,
        )
    }
}

/**
 * Returns a motivational message based on streak length.
 * Deterministic — same streak always gives same message.
 */
private fun motivationalText(streak: Int): String = when {
    streak <= 0 -> "Start your streak today!"
    streak < 3 -> "Keep it going!"
    streak < 7 -> "You're building momentum!"
    streak < 14 -> "One week strong!"
    streak < 30 -> "Unstoppable!"
    streak < 60 -> "A whole month! Legend."
    streak < 100 -> "You are a force of nature."
    else -> "Absolutely unjynxed."
}
