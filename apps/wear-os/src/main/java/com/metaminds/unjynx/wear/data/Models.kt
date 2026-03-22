package com.metaminds.unjynx.wear.data

import kotlinx.serialization.Serializable

/**
 * Lightweight data models for Wear OS.
 *
 * These are minimal subsets of the full phone-app models,
 * containing only the fields needed for watch display.
 * All models are immutable (val only, no mutation).
 */

@Serializable
data class WearTask(
    val id: String,
    val title: String,
    val priority: TaskPriority = TaskPriority.NONE,
    val dueAt: String? = null,        // ISO 8601 datetime
    val isCompleted: Boolean = false,
    val projectName: String? = null,
)

@Serializable
enum class TaskPriority {
    URGENT,
    HIGH,
    MEDIUM,
    LOW,
    NONE,
}

@Serializable
data class DaySummary(
    val totalTasks: Int = 0,
    val completedTasks: Int = 0,
    val focusMinutes: Int = 0,
    val focusGoalMinutes: Int = 120,
    val habitsCompleted: Int = 0,
    val habitsTotal: Int = 0,
    val currentStreak: Int = 0,
    val bestStreak: Int = 0,
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
)

@Serializable
data class TaskListResponse(
    val tasks: List<WearTask>,
)

@Serializable
data class SnoozeRequest(
    val minutes: Int,
)

/**
 * Sealed class representing UI state for screens.
 * Immutable — each state transition produces a new instance.
 */
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}
