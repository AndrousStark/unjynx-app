package com.metaminds.unjynx.wear.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.ui.screens.ProgressRingsScreen
import com.metaminds.unjynx.wear.ui.screens.StreakScreen
import com.metaminds.unjynx.wear.ui.screens.TaskDetailScreen
import com.metaminds.unjynx.wear.ui.screens.TaskListScreen

/**
 * Route definitions for Wear OS navigation.
 */
object WearRoutes {
    const val TASK_LIST = "task_list"
    const val TASK_DETAIL = "task_detail/{taskId}"
    const val PROGRESS_RINGS = "progress_rings"
    const val STREAK = "streak"

    fun taskDetail(taskId: String): String = "task_detail/$taskId"
}

/**
 * Root navigation host for the Wear OS app.
 *
 * Uses SwipeDismissableNavHost (Wear OS standard) which allows
 * swiping right to go back — natural gesture on watch.
 *
 * Screen flow:
 *   TaskList → (tap task) → TaskDetail
 *   TaskList → (swipe left / page) → ProgressRings → Streak
 */
@Composable
fun WearNavHost(repository: TaskRepository) {
    val navController = rememberSwipeDismissableNavController()

    SwipeDismissableNavHost(
        navController = navController,
        startDestination = WearRoutes.TASK_LIST,
    ) {
        // Task list — primary screen
        composable(WearRoutes.TASK_LIST) {
            TaskListScreen(
                repository = repository,
                onTaskClick = { taskId ->
                    navController.navigate(WearRoutes.taskDetail(taskId))
                },
            )
        }

        // Task detail — shows single task with complete/snooze actions
        composable(WearRoutes.TASK_DETAIL) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId") ?: return@composable
            TaskDetailScreen(
                taskId = taskId,
                repository = repository,
                onCompleted = {
                    navController.popBackStack()
                },
                onBack = {
                    navController.popBackStack()
                },
            )
        }

        // Progress rings — 3 concentric animated rings
        composable(WearRoutes.PROGRESS_RINGS) {
            ProgressRingsScreen(repository = repository)
        }

        // Streak — motivational streak counter
        composable(WearRoutes.STREAK) {
            StreakScreen(repository = repository)
        }
    }
}
