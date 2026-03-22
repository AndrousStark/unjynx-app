package com.metaminds.unjynx.wear.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.metaminds.unjynx.wear.data.DaySummary
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.UiState
import com.metaminds.unjynx.wear.ui.components.FormatUtils
import com.metaminds.unjynx.wear.ui.theme.UnjynxColors
import com.metaminds.unjynx.wear.ui.theme.UnjynxTypography
import androidx.wear.compose.material3.Text

/**
 * Progress rings screen — 3 concentric animated rings.
 *
 * Outer ring (gold): Tasks completion
 * Middle ring (violet): Focus time
 * Inner ring (emerald): Habits completion
 *
 * Center shows the overall percentage in large display text.
 * Rings animate from 0 to their target value on screen appear.
 */
@Composable
fun ProgressRingsScreen(
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
                    textAlign = TextAlign.Center,
                )
            }
            is UiState.Success -> {
                ProgressRingsContent(summary = state.data)
            }
        }
    }
}

@Composable
private fun ProgressRingsContent(summary: DaySummary) {
    // Animation progress for each ring
    val taskProgress = remember { Animatable(0f) }
    val focusProgress = remember { Animatable(0f) }
    val habitProgress = remember { Animatable(0f) }

    // Target fractions
    val taskFraction = FormatUtils.completionFraction(summary.completedTasks, summary.totalTasks)
    val focusFraction = FormatUtils.completionFraction(summary.focusMinutes, summary.focusGoalMinutes)
    val habitFraction = FormatUtils.completionFraction(summary.habitsCompleted, summary.habitsTotal)

    // Animate on appear with staggered delays
    LaunchedEffect(summary) {
        taskProgress.animateTo(
            targetValue = taskFraction,
            animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        )
    }
    LaunchedEffect(summary) {
        focusProgress.animateTo(
            targetValue = focusFraction,
            animationSpec = tween(
                durationMillis = 800,
                delayMillis = 100,
                easing = FastOutSlowInEasing,
            ),
        )
    }
    LaunchedEffect(summary) {
        habitProgress.animateTo(
            targetValue = habitFraction,
            animationSpec = tween(
                durationMillis = 800,
                delayMillis = 200,
                easing = FastOutSlowInEasing,
            ),
        )
    }

    // Overall percentage (average of all three)
    val overallPct = if (summary.totalTasks > 0 || summary.habitsTotal > 0) {
        val weights = listOfNotNull(
            if (summary.totalTasks > 0) taskFraction else null,
            if (summary.focusGoalMinutes > 0) focusFraction else null,
            if (summary.habitsTotal > 0) habitFraction else null,
        )
        if (weights.isNotEmpty()) {
            ((weights.sum() / weights.size) * 100).toInt().coerceIn(0, 100)
        } else 0
    } else 0

    Box(
        modifier = Modifier.size(180.dp),
        contentAlignment = Alignment.Center,
    ) {
        // Three concentric rings
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2, size.height / 2)
            val startAngle = -90f // Start from top

            // Outer ring — Tasks (gold)
            drawRing(
                center = center,
                radius = size.minDimension / 2 - 8.dp.toPx(),
                strokeWidth = 10.dp.toPx(),
                trackColor = UnjynxColors.ElectricGold.copy(alpha = 0.15f),
                progressColor = UnjynxColors.RingTasks,
                progress = taskProgress.value,
                startAngle = startAngle,
            )

            // Middle ring — Focus (violet)
            drawRing(
                center = center,
                radius = size.minDimension / 2 - 24.dp.toPx(),
                strokeWidth = 10.dp.toPx(),
                trackColor = UnjynxColors.VioletLight.copy(alpha = 0.15f),
                progressColor = UnjynxColors.RingFocus,
                progress = focusProgress.value,
                startAngle = startAngle,
            )

            // Inner ring — Habits (emerald)
            drawRing(
                center = center,
                radius = size.minDimension / 2 - 40.dp.toPx(),
                strokeWidth = 10.dp.toPx(),
                trackColor = UnjynxColors.RingHabits.copy(alpha = 0.15f),
                progressColor = UnjynxColors.RingHabits,
                progress = habitProgress.value,
                startAngle = startAngle,
            )
        }

        // Center text
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "$overallPct%",
                style = UnjynxTypography.displayLarge,
                color = UnjynxColors.TextPrimary,
            )
            Text(
                text = "today",
                style = UnjynxTypography.labelSmall,
                color = UnjynxColors.TextTertiary,
            )
        }
    }

    // Ring legend below
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(bottom = 12.dp),
        verticalArrangement = Arrangement.Bottom,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        RingLegend(
            taskLabel = "${summary.completedTasks}/${summary.totalTasks} tasks",
            focusLabel = "${summary.focusMinutes}m focus",
            habitLabel = "${summary.habitsCompleted}/${summary.habitsTotal} habits",
        )
    }
}

@Composable
private fun RingLegend(
    taskLabel: String,
    focusLabel: String,
    habitLabel: String,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(1.dp),
    ) {
        LegendItem(color = UnjynxColors.RingTasks, label = taskLabel)
        LegendItem(color = UnjynxColors.RingFocus, label = focusLabel)
        LegendItem(color = UnjynxColors.RingHabits, label = habitLabel)
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Text(
        text = label,
        style = UnjynxTypography.labelSmall,
        color = color,
    )
}

/**
 * Draw a single ring (track + progress arc) on Canvas.
 */
private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawRing(
    center: Offset,
    radius: Float,
    strokeWidth: Float,
    trackColor: Color,
    progressColor: Color,
    progress: Float,
    startAngle: Float,
) {
    val topLeft = Offset(center.x - radius, center.y - radius)
    val arcSize = Size(radius * 2, radius * 2)

    // Track (full circle, dimmed)
    drawArc(
        color = trackColor,
        startAngle = 0f,
        sweepAngle = 360f,
        useCenter = false,
        topLeft = topLeft,
        size = arcSize,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
    )

    // Progress arc
    if (progress > 0f) {
        drawArc(
            color = progressColor,
            startAngle = startAngle,
            sweepAngle = 360f * progress,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
        )
    }
}
