package com.metaminds.unjynx.wear.voice

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import com.metaminds.unjynx.wear.data.ApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Handles voice actions from Google Assistant and system voice input.
 *
 * Registered in AndroidManifest.xml with ACTION_CREATE_NOTE and
 * VOICE_ASSIST intent filters. Parses voice input to create tasks,
 * complete tasks, or query task list.
 */
class VoiceActionReceiver : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        when (intent.action) {
            // Direct voice action: "Create a note in UNJYNX"
            "com.google.android.gms.actions.CREATE_NOTE",
            "android.intent.action.CREATE_NOTE" -> {
                val title = intent.getStringExtra(Intent.EXTRA_TEXT)
                    ?: intent.getStringExtra("android.intent.extra.NOTE_TITLE")

                if (title != null) {
                    createTask(title)
                } else {
                    // No text provided — launch speech recognizer
                    launchSpeechRecognizer("What task do you want to create?")
                }
            }

            // Generic voice assist
            "android.intent.action.VOICE_ASSIST",
            Intent.ACTION_ASSIST -> {
                launchSpeechRecognizer("What would you like to do?")
            }

            else -> finish()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == SPEECH_REQUEST_CODE && resultCode == RESULT_OK) {
            val results = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val spokenText = results?.firstOrNull()

            if (spokenText != null) {
                processVoiceCommand(spokenText)
            } else {
                finish()
            }
        } else {
            finish()
        }
    }

    private fun launchSpeechRecognizer(prompt: String) {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PROMPT, prompt)
        }
        startActivityForResult(intent, SPEECH_REQUEST_CODE)
    }

    private fun processVoiceCommand(text: String) {
        val lower = text.lowercase()

        when {
            lower.startsWith("create") || lower.startsWith("add") || lower.startsWith("new task") -> {
                val taskTitle = text
                    .removePrefix("create")
                    .removePrefix("add")
                    .removePrefix("new task")
                    .removePrefix("task")
                    .trim()
                if (taskTitle.isNotEmpty()) {
                    createTask(taskTitle)
                } else {
                    finish()
                }
            }

            lower.startsWith("complete") || lower.startsWith("finish") || lower.startsWith("done") -> {
                completeNextTask()
            }

            lower.startsWith("what") || lower.startsWith("show") || lower.startsWith("list") -> {
                // Open task list screen
                finish()
            }

            else -> {
                // Treat as new task title
                createTask(text)
            }
        }
    }

    private fun createTask(title: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ApiClient.post(
                    "/api/v1/tasks",
                    mapOf("title" to title, "priority" to "none"),
                )
            } catch (_: Exception) {
                // Swallow — best effort
            }
            runOnUiThread { finish() }
        }
    }

    private fun completeNextTask() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val data = ApiClient.get("/api/v1/tasks?limit=1&status=pending")
                val tasks = (data?.get("data") as? List<*>)
                val first = tasks?.firstOrNull() as? Map<*, *>
                val taskId = first?.get("id") as? String
                if (taskId != null) {
                    ApiClient.post("/api/v1/tasks/$taskId/complete", emptyMap())
                }
            } catch (_: Exception) {
                // Swallow
            }
            runOnUiThread { finish() }
        }
    }

    companion object {
        private const val SPEECH_REQUEST_CODE = 101
    }
}
