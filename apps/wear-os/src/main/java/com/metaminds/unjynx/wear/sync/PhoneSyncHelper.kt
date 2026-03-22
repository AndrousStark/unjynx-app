package com.metaminds.unjynx.wear.sync

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.CapabilityClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await

/**
 * Helper for sending data/requests from the watch to the phone.
 *
 * Used for:
 * - Requesting auth token from phone
 * - Sending task completion events back to phone
 * - Requesting a force-sync
 *
 * All operations are coroutine-safe (suspend functions).
 */
class PhoneSyncHelper(private val context: Context) {

    companion object {
        private const val TAG = "PhoneSyncHelper"
        private const val CAPABILITY_PHONE_APP = "unjynx_phone_app"
        private const val PATH_REQUEST_AUTH = "/unjynx/request_auth"
        private const val PATH_TASK_COMPLETED = "/unjynx/task_completed"
        private const val PATH_REQUEST_SYNC = "/unjynx/request_sync"
    }

    private val messageClient = Wearable.getMessageClient(context)
    private val capabilityClient = Wearable.getCapabilityClient(context)

    /**
     * Find the connected phone node ID.
     * Returns null if no phone is connected or the phone app is not installed.
     */
    private suspend fun getPhoneNodeId(): String? {
        return try {
            val capabilityInfo = capabilityClient.getCapability(
                CAPABILITY_PHONE_APP,
                CapabilityClient.FILTER_REACHABLE,
            ).await()

            capabilityInfo.nodes.firstOrNull()?.id
        } catch (e: Exception) {
            Log.e(TAG, "Failed to find phone node", e)
            null
        }
    }

    /**
     * Request the phone to send its auth token to the watch.
     * Called during initial pairing or when auth is missing.
     */
    suspend fun requestAuthToken(): Boolean {
        val nodeId = getPhoneNodeId() ?: run {
            Log.w(TAG, "No phone node found for auth request")
            return false
        }

        return try {
            messageClient.sendMessage(nodeId, PATH_REQUEST_AUTH, byteArrayOf()).await()
            Log.i(TAG, "Auth token requested from phone")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to request auth token", e)
            false
        }
    }

    /**
     * Notify the phone that a task was completed on the watch.
     * The phone app should update its local state and sync to backend.
     */
    suspend fun notifyTaskCompleted(taskId: String): Boolean {
        val nodeId = getPhoneNodeId() ?: return false

        return try {
            val data = taskId.toByteArray(Charsets.UTF_8)
            messageClient.sendMessage(nodeId, PATH_TASK_COMPLETED, data).await()
            Log.i(TAG, "Task completion notified to phone: $taskId")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to notify task completion", e)
            false
        }
    }

    /**
     * Request the phone to push a full data sync to the watch.
     */
    suspend fun requestSync(): Boolean {
        val nodeId = getPhoneNodeId() ?: return false

        return try {
            messageClient.sendMessage(nodeId, PATH_REQUEST_SYNC, byteArrayOf()).await()
            Log.i(TAG, "Sync requested from phone")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to request sync", e)
            false
        }
    }

    /**
     * Check if the phone app is reachable.
     */
    suspend fun isPhoneConnected(): Boolean {
        return getPhoneNodeId() != null
    }
}
