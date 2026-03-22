package com.metaminds.unjynx.wear.data

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Lightweight HTTP client for Wear OS.
 *
 * Uses OkHttp directly (no Retrofit) to minimize APK size.
 * All methods are suspend functions running on IO dispatcher.
 * Bearer token is stored in SharedPreferences (set during phone pairing).
 */
class ApiClient(context: Context) {

    companion object {
        private const val BASE_URL = "https://api.unjynx.me/api/v1"
        private const val PREFS_NAME = "unjynx_wear_prefs"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val CONNECT_TIMEOUT_SECONDS = 10L
        private const val READ_TIMEOUT_SECONDS = 15L

        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .build()

    // --- Auth token management ---

    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun setAuthToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }

    fun clearAuthToken() {
        prefs.edit().remove(KEY_AUTH_TOKEN).apply()
    }

    fun isAuthenticated(): Boolean = getAuthToken() != null

    // --- API Methods ---

    /**
     * Fetch today's tasks, limited to 10, sorted by due date.
     */
    suspend fun getTasks(): Result<List<WearTask>> = withContext(Dispatchers.IO) {
        try {
            val request = buildGetRequest("/tasks?limit=10&sort=dueAt&filter=today&status=pending")
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                return@withContext Result.failure(
                    IOException("API error: ${response.code} ${response.message}")
                )
            }

            val body = response.body?.string()
                ?: return@withContext Result.failure(IOException("Empty response body"))

            val apiResponse = json.decodeFromString<ApiResponse<TaskListResponse>>(body)
            if (apiResponse.success && apiResponse.data != null) {
                Result.success(apiResponse.data.tasks)
            } else {
                Result.failure(IOException(apiResponse.error ?: "Unknown API error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Fetch today's progress summary (tasks, focus, habits, streak).
     */
    suspend fun getSummary(): Result<DaySummary> = withContext(Dispatchers.IO) {
        try {
            val request = buildGetRequest("/progress/today")
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                return@withContext Result.failure(
                    IOException("API error: ${response.code} ${response.message}")
                )
            }

            val body = response.body?.string()
                ?: return@withContext Result.failure(IOException("Empty response body"))

            val apiResponse = json.decodeFromString<ApiResponse<DaySummary>>(body)
            if (apiResponse.success && apiResponse.data != null) {
                Result.success(apiResponse.data)
            } else {
                Result.failure(IOException(apiResponse.error ?: "Unknown API error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Mark a task as completed.
     */
    suspend fun completeTask(taskId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val request = buildPatchRequest(
                path = "/tasks/$taskId",
                body = """{"status":"completed"}""",
            )
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                return@withContext Result.failure(
                    IOException("API error: ${response.code} ${response.message}")
                )
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Snooze a task by the given number of minutes.
     */
    suspend fun snoozeTask(taskId: String, minutes: Int): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val snoozeBody = json.encodeToString(SnoozeRequest(minutes))
            val request = buildPostRequest(
                path = "/tasks/$taskId/snooze",
                body = snoozeBody,
            )
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                return@withContext Result.failure(
                    IOException("API error: ${response.code} ${response.message}")
                )
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // --- Request builders ---

    private fun buildGetRequest(path: String): Request {
        val builder = Request.Builder()
            .url("$BASE_URL$path")
            .get()
        addAuthHeader(builder)
        return builder.build()
    }

    private fun buildPostRequest(path: String, body: String): Request {
        val builder = Request.Builder()
            .url("$BASE_URL$path")
            .post(body.toRequestBody(JSON_MEDIA_TYPE))
        addAuthHeader(builder)
        return builder.build()
    }

    private fun buildPatchRequest(path: String, body: String): Request {
        val builder = Request.Builder()
            .url("$BASE_URL$path")
            .patch(body.toRequestBody(JSON_MEDIA_TYPE))
        addAuthHeader(builder)
        return builder.build()
    }

    private fun addAuthHeader(builder: Request.Builder) {
        val token = getAuthToken()
        if (token != null) {
            builder.addHeader("Authorization", "Bearer $token")
        }
    }
}
