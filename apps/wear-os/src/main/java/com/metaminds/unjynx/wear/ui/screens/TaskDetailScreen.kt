package com.metaminds.unjynx.wear.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material3.Button
import androidx.wear.compose.material3.ButtonDefaults
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Text
import com.metaminds.unjynx.wear.data.TaskPriority
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.UiState
import com.metaminds.unjynx.wear.data.WearTask
import com.metaminds.unjynx.wear.ui.components.FormatUtils
import com.metaminds.unjynx.wear.ui.components.HapticUtils
import com.metaminds.unjynx.wear.ui.components.priorityToColor
import com.metaminds.unjynx.wear.ui.theme.LocalUnjynxColors
import com.metaminds.unjynx.wear.ui.theme.UnjynxColors
import com.metaminds.unjynx.wear.ui.theme.UnjynxTypography
import kotlinx.coroutines.launch

/**
 * Task detail screen — minimal, read-only view with action buttons.
 *
 * Shows task title, priority badge, due time.
 * Actions: Complete (gold), Snooze (30min / 1h / tomorrow).
 * Editing is intentionally omitted — that happens on the phone.
 */
@Composable
fun TaskDetailScreen(
    taskId: String,
    repository: TaskRepository,
    onCompleted: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tasksState by repository.tasks.collectAsState(initial = UiState.Loading)
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isActioning by remember { mutableStateOf(false) }
    val listState = rememberScalingLazyListState()

    // Find the task from current state
    val task: WearTask? = when (val state = tasksState) {
        is UiState.Success -> state.data.find { it.id == taskId }
        else -> null
    }

    if (task == null) {
        // Task not found (completed or removed) — go back
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(UnjynxColors.SurfaceBase),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "Task not found",
                style = UnjynxTypography.bodyMedium,
                color = UnjynxColors.TextSecondary,
            )
        }
        return
    }

    ScalingLazyColumn(
        state = listState,
        modifier = modifier
            .fillMaxSize()
            .background(UnjynxColors.SurfaceBase)
            .onRotaryScrollEvent { event ->
                listState.dispatchRawDelta(event.verticalScrollPixels)
                true
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        // Top spacer for round screen
        item { Spacer(modifier = Modifier.height(4.dp)) }

        // Priority badge
        item {
            PriorityBadge(priority = task.priority)
        }

        // Task title
        item {
            Text(
                text = task.title,
                style = UnjynxTypography.titleLarge,
                color = UnjynxColors.TextPrimary,
                textAlign = TextAlign.Center,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        // Due time
        item {
            val dueText = FormatUtils.formatDueTime(task.dueAt)
            if (dueText.isNotEmpty()) {
                Text(
                    text = dueText,
                    style = UnjynxTypography.bodyMedium,
                    color = if (dueText == "Overdue") {
                        UnjynxColors.PriorityUrgent
                    } else {
                        UnjynxColors.TextSecondary
                    },
                )
            }
        }

        // Project name
        if (task.projectName != null) {
            item {
                Text(
                    text = task.projectName,
                    style = UnjynxTypography.bodySmall,
                    color = UnjynxColors.TextTertiary,
                )
            }
        }

        // Complete button (gold, full width)
        item {
            Spacer(modifier = Modifier.height(4.dp))
            Button(
                onClick = {
                    if (!isActioning) {
                        isActioning = true
                        HapticUtils.successFeedback(context)
                        scope.launch {
                            repository.completeTask(taskId)
                            onCompleted()
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = UnjynxColors.ElectricGold,
                    contentColor = UnjynxColors.TextOnGold,
                ),
                enabled = !isActioning,
                shape = RoundedCornerShape(24.dp),
            ) {
                Text(
                    text = "Complete",
                    style = UnjynxTypography.labelLarge,
                )
            }
        }

        // Snooze options row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                SnoozeChip(
                    label = "30m",
                    onClick = {
                        if (!isActioning) {
                            isActioning = true
                            HapticUtils.mediumImpact(context)
                            scope.launch {
                                repository.snoozeTask(taskId, 30)
                                onBack()
                            }
                        }
                    },
                    enabled = !isActioning,
                )
                SnoozeChip(
                    label = "1h",
                    onClick = {
                        if (!isActioning) {
                            isActioning = true
                            HapticUtils.mediumImpact(context)
                            scope.launch {
                                repository.snoozeTask(taskId, 60)
                                onBack()
                            }
                        }
                    },
                    enabled = !isActioning,
                )
                SnoozeChip(
                    label = "Tmrw",
                    onClick = {
                        if (!isActioning) {
                            isActioning = true
                            HapticUtils.mediumImpact(context)
                            scope.launch {
                                repository.snoozeTask(taskId, 1440) // 24 hours
                                onBack()
                            }
                        }
                    },
                    enabled = !isActioning,
                )
            }
        }

        // Bottom spacer
        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun PriorityBadge(priority: TaskPriority) {
    val color = priorityToColor(priority)
    val label = when (priority) {
        TaskPriority.URGENT -> "URGENT"
        TaskPriority.HIGH -> "HIGH"
        TaskPriority.MEDIUM -> "MEDIUM"
        TaskPriority.LOW -> "LOW"
        TaskPriority.NONE -> "TASK"
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.2f))
            .padding(horizontal = 10.dp, vertical = 3.dp),
    ) {
        Text(
            text = label,
            style = UnjynxTypography.labelSmall,
            color = color,
        )
    }
}

@Composable
private fun SnoozeChip(
    label: String,
    onClick: () -> Unit,
    enabled: Boolean,
) {
    Button(
        onClick = onClick,
        modifier = Modifier.size(width = 52.dp, height = 32.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = UnjynxColors.SurfaceOverlay,
            contentColor = UnjynxColors.TextSecondary,
        ),
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
    ) {
        Text(
            text = label,
            style = UnjynxTypography.labelSmall,
        )
    }
}
