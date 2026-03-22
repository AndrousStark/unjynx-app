package com.metaminds.unjynx.wear.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material3.Card
import androidx.wear.compose.material3.CardDefaults
import androidx.wear.compose.material3.CircularProgressIndicator
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.SwipeToDismissBox
import androidx.wear.compose.material3.Text
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.UiState
import com.metaminds.unjynx.wear.data.WearTask
import com.metaminds.unjynx.wear.ui.components.FormatUtils
import com.metaminds.unjynx.wear.ui.components.HapticUtils
import com.metaminds.unjynx.wear.ui.components.PriorityDot
import com.metaminds.unjynx.wear.ui.theme.LocalUnjynxColors
import com.metaminds.unjynx.wear.ui.theme.UnjynxColors
import com.metaminds.unjynx.wear.ui.theme.UnjynxTypography
import kotlinx.coroutines.launch

/**
 * Task list screen — the primary watch screen.
 *
 * Displays up to 10 pending tasks in a ScalingLazyColumn with rotary scroll support.
 * Each card shows: priority dot, title (max 2 lines), due time.
 * Tapping a task navigates to the detail screen.
 * Swipe-to-complete triggers haptic feedback and optimistic removal.
 */
@Composable
fun TaskListScreen(
    repository: TaskRepository,
    onTaskClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val tasksState by repository.tasks.collectAsState(initial = UiState.Loading)
    val context = LocalContext.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(UnjynxColors.SurfaceBase),
        contentAlignment = Alignment.Center,
    ) {
        when (val state = tasksState) {
            is UiState.Loading -> LoadingIndicator()
            is UiState.Error -> ErrorState(message = state.message)
            is UiState.Success -> {
                if (state.data.isEmpty()) {
                    EmptyTasksState()
                } else {
                    TaskList(
                        tasks = state.data,
                        onTaskClick = { taskId ->
                            HapticUtils.lightImpact(context)
                            onTaskClick(taskId)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun TaskList(
    tasks: List<WearTask>,
    onTaskClick: (String) -> Unit,
) {
    val listState = rememberScalingLazyListState()

    ScalingLazyColumn(
        state = listState,
        modifier = Modifier
            .fillMaxSize()
            .onRotaryScrollEvent { event ->
                // Rotary input support for crown/bezel scrolling
                listState.dispatchRawDelta(event.verticalScrollPixels)
                true
            },
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        // Header spacer for round screen
        item {
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Title
        item {
            Text(
                text = "Today",
                style = UnjynxTypography.titleLarge,
                color = UnjynxColors.ElectricGold,
                modifier = Modifier.padding(bottom = 4.dp),
            )
        }

        items(
            items = tasks,
            key = { it.id },
        ) { task ->
            TaskCard(
                task = task,
                onClick = { onTaskClick(task.id) },
            )
        }

        // Bottom spacer for round screen
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun TaskCard(
    task: WearTask,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = UnjynxColors.SurfaceElevated,
        ),
        shape = RoundedCornerShape(12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Priority indicator
            PriorityDot(priority = task.priority)

            Spacer(modifier = Modifier.width(8.dp))

            // Task info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = UnjynxTypography.titleMedium,
                    color = UnjynxColors.TextPrimary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )

                val dueText = FormatUtils.formatDueTime(task.dueAt)
                if (dueText.isNotEmpty()) {
                    Text(
                        text = dueText,
                        style = UnjynxTypography.bodySmall,
                        color = if (dueText == "Overdue") {
                            UnjynxColors.PriorityUrgent
                        } else {
                            UnjynxColors.TextSecondary
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyTasksState() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Gold checkmark circle
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(UnjynxColors.ElectricGold.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "\u2713", // Checkmark
                style = UnjynxTypography.displayLarge.copy(
                    fontSize = androidx.compose.ui.unit.TextUnit(28f, androidx.compose.ui.unit.TextUnitType.Sp),
                ),
                color = UnjynxColors.ElectricGold,
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "All caught up!",
            style = UnjynxTypography.titleMedium,
            color = UnjynxColors.ElectricGold,
        )
    }
}

@Composable
private fun LoadingIndicator() {
    CircularProgressIndicator(
        modifier = Modifier.size(32.dp),
        indicatorColor = UnjynxColors.ElectricGold,
        trackColor = UnjynxColors.SurfaceElevated,
        strokeWidth = 3.dp,
    )
}

@Composable
private fun ErrorState(message: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "!",
            style = UnjynxTypography.titleLarge,
            color = UnjynxColors.Error,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = message,
            style = UnjynxTypography.bodySmall,
            color = UnjynxColors.TextSecondary,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
    }
}
