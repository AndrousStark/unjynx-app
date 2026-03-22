package com.metaminds.unjynx.wear.sync

import android.util.Log
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import com.metaminds.unjynx.wear.data.DaySummary
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.WearTask
import com.metaminds.unjynx.wear.data.TaskPriority
import kotlinx.serialization.json.Json

/**
 * DataLayer listener — receives data synced from the phone app.
 *
 * Listens for:
 * - /unjynx/tasks — task list updates
 * - /unjynx/summary — daily summary updates
 * - /unjynx/auth — auth token from phone pairing
 *
 * Max payload per DataLayer message: 100KB.
 * Tasks are pre-filtered on the phone side to keep payloads small.
 */
class DataLayerListenerService : WearableListenerService() {

    companion object {
        private const val TAG = "UnjynxDataLayer"
        private const val PATH_TASKS = "/unjynx/tasks"
        private const val PATH_SUMMARY = "/unjynx/summary"
        private const val PATH_AUTH = "/unjynx/auth"
        private const val KEY_TASKS_JSON = "tasks_json"
        private const val KEY_SUMMARY_JSON = "summary_json"
        private const val KEY_AUTH_TOKEN = "auth_token"

        /** Max payload size to accept (100KB safety limit) */
        private const val MAX_PAYLOAD_BYTES = 100 * 1024
    }

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        val repository = TaskRepository(applicationContext)

        for (event in dataEvents) {
            if (event.type != DataEvent.TYPE_CHANGED) continue

            val dataItem = event.dataItem
            val path = dataItem.uri.path ?: continue

            try {
                when (path) {
                    PATH_TASKS -> handleTasksUpdate(dataItem, repository)
                    PATH_SUMMARY -> handleSummaryUpdate(dataItem, repository)
                    PATH_AUTH -> handleAuthUpdate(dataItem, repository)
                    else -> Log.d(TAG, "Unknown data path: $path")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing data event at $path", e)
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        val path = messageEvent.path
        val data = messageEvent.data

        Log.d(TAG, "Message received: $path (${data.size} bytes)")

        // Validate payload size
        if (data.size > MAX_PAYLOAD_BYTES) {
            Log.w(TAG, "Payload too large (${data.size} bytes), ignoring")
            return
        }

        val repository = TaskRepository(applicationContext)

        try {
            when (path) {
                PATH_AUTH -> {
                    val token = String(data, Charsets.UTF_8)
                    if (token.isNotBlank()) {
                        repository.setAuthToken(token)
                        Log.i(TAG, "Auth token received from phone")
                    }
                }
                PATH_TASKS -> {
                    val tasksJson = String(data, Charsets.UTF_8)
                    val tasks = json.decodeFromString<List<WearTask>>(tasksJson)
                    repository.updateFromSync(tasks, summary = null)
                    Log.i(TAG, "Tasks synced from phone: ${tasks.size} items")
                }
                PATH_SUMMARY -> {
                    val summaryJson = String(data, Charsets.UTF_8)
                    val summary = json.decodeFromString<DaySummary>(summaryJson)
                    repository.updateFromSync(tasks = emptyList(), summary = summary)
                    Log.i(TAG, "Summary synced from phone")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing message at $path", e)
        }
    }

    private fun handleTasksUpdate(
        dataItem: com.google.android.gms.wearable.DataItem,
        repository: TaskRepository,
    ) {
        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
        val tasksJson = dataMap.getString(KEY_TASKS_JSON) ?: return

        if (tasksJson.length > MAX_PAYLOAD_BYTES) {
            Log.w(TAG, "Tasks JSON too large, ignoring")
            return
        }

        val tasks = json.decodeFromString<List<WearTask>>(tasksJson)
        repository.updateFromSync(tasks, summary = null)
        Log.i(TAG, "Tasks updated via DataLayer: ${tasks.size} items")
    }

    private fun handleSummaryUpdate(
        dataItem: com.google.android.gms.wearable.DataItem,
        repository: TaskRepository,
    ) {
        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
        val summaryJson = dataMap.getString(KEY_SUMMARY_JSON) ?: return

        val summary = json.decodeFromString<DaySummary>(summaryJson)
        repository.updateFromSync(tasks = emptyList(), summary = summary)
        Log.i(TAG, "Summary updated via DataLayer")
    }

    private fun handleAuthUpdate(
        dataItem: com.google.android.gms.wearable.DataItem,
        repository: TaskRepository,
    ) {
        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
        val token = dataMap.getString(KEY_AUTH_TOKEN)

        if (!token.isNullOrBlank()) {
            repository.setAuthToken(token)
            Log.i(TAG, "Auth token updated via DataLayer")
        }
    }
}
