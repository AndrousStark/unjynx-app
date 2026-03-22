package com.metaminds.unjynx.wear.data

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Repository that caches tasks and summary in SharedPreferences.
 *
 * Provides Flow-based observation for UI reactivity.
 * Cache is the single source of truth for the watch;
 * refreshes come from API calls or DataLayer sync from the phone.
 *
 * All state transitions produce new immutable lists/objects (no mutation).
 */
class TaskRepository(context: Context) {

    companion object {
        private const val PREFS_NAME = "unjynx_wear_cache"
        private const val KEY_TASKS = "cached_tasks"
        private const val KEY_SUMMARY = "cached_summary"
        private const val KEY_LAST_REFRESH = "last_refresh_ms"
        private const val STALE_THRESHOLD_MS = 5 * 60 * 1000L // 5 minutes
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val apiClient = ApiClient(context)

    // --- Flow-based observation ---

    private val _tasks = MutableStateFlow<UiState<List<WearTask>>>(UiState.Loading)
    val tasks: Flow<UiState<List<WearTask>>> = _tasks.asStateFlow()

    private val _summary = MutableStateFlow<UiState<DaySummary>>(UiState.Loading)
    val summary: Flow<UiState<DaySummary>> = _summary.asStateFlow()

    init {
        // Load from cache immediately
        loadCachedTasks()
        loadCachedSummary()
    }

    // --- Public refresh methods ---

    /**
     * Refresh tasks from API, updating cache and Flow.
     * Falls back to cached data on network failure.
     */
    suspend fun refreshTasks() {
        val result = apiClient.getTasks()
        result.fold(
            onSuccess = { freshTasks ->
                val sorted = freshTasks
                    .filter { !it.isCompleted }
                    .sortedBy { it.dueAt }
                    .take(10)
                cacheTasks(sorted)
                _tasks.value = UiState.Success(sorted)
            },
            onFailure = { error ->
                // If we have cached data, keep showing it
                val cached = getCachedTasks()
                if (cached.isNotEmpty()) {
                    _tasks.value = UiState.Success(cached)
                } else {
                    _tasks.value = UiState.Error(error.message ?: "Failed to load tasks")
                }
            },
        )
    }

    /**
     * Refresh summary from API, updating cache and Flow.
     */
    suspend fun refreshSummary() {
        val result = apiClient.getSummary()
        result.fold(
            onSuccess = { freshSummary ->
                cacheSummary(freshSummary)
                _summary.value = UiState.Success(freshSummary)
            },
            onFailure = { error ->
                val cached = getCachedSummary()
                if (cached != null) {
                    _summary.value = UiState.Success(cached)
                } else {
                    _summary.value = UiState.Error(error.message ?: "Failed to load summary")
                }
            },
        )
    }

    /**
     * Complete a task — optimistic update with rollback on failure.
     */
    suspend fun completeTask(taskId: String): Result<Unit> {
        // Optimistic: remove from current list immediately
        val currentTasks = when (val state = _tasks.value) {
            is UiState.Success -> state.data
            else -> emptyList()
        }
        val updatedTasks = currentTasks.filter { it.id != taskId }
        _tasks.value = UiState.Success(updatedTasks)
        cacheTasks(updatedTasks)

        // Send to API
        val result = apiClient.completeTask(taskId)
        if (result.isFailure) {
            // Rollback — restore original list
            _tasks.value = UiState.Success(currentTasks)
            cacheTasks(currentTasks)
        }
        return result
    }

    /**
     * Snooze a task — optimistic update with rollback on failure.
     */
    suspend fun snoozeTask(taskId: String, minutes: Int): Result<Unit> {
        // Optimistic: remove from current list (snoozed = no longer due now)
        val currentTasks = when (val state = _tasks.value) {
            is UiState.Success -> state.data
            else -> emptyList()
        }
        val updatedTasks = currentTasks.filter { it.id != taskId }
        _tasks.value = UiState.Success(updatedTasks)
        cacheTasks(updatedTasks)

        val result = apiClient.snoozeTask(taskId, minutes)
        if (result.isFailure) {
            // Rollback
            _tasks.value = UiState.Success(currentTasks)
            cacheTasks(currentTasks)
        }
        return result
    }

    /**
     * Update tasks from DataLayer sync (phone push).
     * Bypasses API — data comes directly from the phone app.
     */
    fun updateFromSync(tasks: List<WearTask>, summary: DaySummary?) {
        val sorted = tasks
            .filter { !it.isCompleted }
            .sortedBy { it.dueAt }
            .take(10)
        cacheTasks(sorted)
        _tasks.value = UiState.Success(sorted)

        if (summary != null) {
            cacheSummary(summary)
            _summary.value = UiState.Success(summary)
        }
    }

    fun isAuthenticated(): Boolean = apiClient.isAuthenticated()

    fun setAuthToken(token: String) = apiClient.setAuthToken(token)

    fun isStale(): Boolean {
        val lastRefresh = prefs.getLong(KEY_LAST_REFRESH, 0L)
        return System.currentTimeMillis() - lastRefresh > STALE_THRESHOLD_MS
    }

    // --- Cache helpers ---

    private fun cacheTasks(tasks: List<WearTask>) {
        prefs.edit()
            .putString(KEY_TASKS, json.encodeToString(tasks))
            .putLong(KEY_LAST_REFRESH, System.currentTimeMillis())
            .apply()
    }

    private fun cacheSummary(summary: DaySummary) {
        prefs.edit()
            .putString(KEY_SUMMARY, json.encodeToString(summary))
            .apply()
    }

    private fun getCachedTasks(): List<WearTask> {
        val raw = prefs.getString(KEY_TASKS, null) ?: return emptyList()
        return try {
            json.decodeFromString<List<WearTask>>(raw)
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun getCachedSummary(): DaySummary? {
        val raw = prefs.getString(KEY_SUMMARY, null) ?: return null
        return try {
            json.decodeFromString<DaySummary>(raw)
        } catch (_: Exception) {
            null
        }
    }

    private fun loadCachedTasks() {
        val cached = getCachedTasks()
        _tasks.value = if (cached.isNotEmpty()) {
            UiState.Success(cached)
        } else {
            UiState.Loading
        }
    }

    private fun loadCachedSummary() {
        val cached = getCachedSummary()
        _summary.value = if (cached != null) {
            UiState.Success(cached)
        } else {
            UiState.Loading
        }
    }
}
