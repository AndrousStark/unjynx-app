package com.metaminds.unjynx.wear.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.metaminds.unjynx.wear.data.TaskPriority
import com.metaminds.unjynx.wear.ui.theme.UnjynxColors

/**
 * Small colored dot indicating task priority.
 * Consistent with the mobile app's priority color system.
 */
@Composable
fun PriorityDot(
    priority: TaskPriority,
    modifier: Modifier = Modifier,
    size: Int = 8,
) {
    val color = priorityToColor(priority)
    Canvas(modifier = modifier.size(size.dp)) {
        drawCircle(color = color)
    }
}

fun priorityToColor(priority: TaskPriority): Color = when (priority) {
    TaskPriority.URGENT -> UnjynxColors.PriorityUrgent
    TaskPriority.HIGH -> UnjynxColors.PriorityHigh
    TaskPriority.MEDIUM -> UnjynxColors.PriorityMedium
    TaskPriority.LOW -> UnjynxColors.PriorityLow
    TaskPriority.NONE -> UnjynxColors.PriorityNone
}
