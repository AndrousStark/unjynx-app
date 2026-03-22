package com.metaminds.unjynx.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.metaminds.unjynx.wear.data.SyncWorker
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.navigation.WearNavHost
import com.metaminds.unjynx.wear.sync.PhoneSyncHelper
import com.metaminds.unjynx.wear.ui.theme.UnjynxWearTheme
import kotlinx.coroutines.launch

/**
 * Main entry point for the UNJYNX Wear OS app.
 *
 * Responsibilities:
 * - Initialize theme and navigation
 * - Set up TaskRepository (singleton per activity lifecycle)
 * - Schedule background sync worker
 * - Handle deep-link intents from tiles (taskId, screen)
 * - Request initial data refresh
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Splash screen — shows during cold start
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // Schedule periodic background sync
        SyncWorker.schedule(applicationContext)

        // Check for deep-link extras from tiles
        val deepLinkTaskId = intent?.getStringExtra("taskId")
        val deepLinkScreen = intent?.getStringExtra("screen")

        setContent {
            val context = LocalContext.current
            val repository = remember { TaskRepository(context) }

            // Initial data load
            LaunchedEffect(Unit) {
                // Refresh from API on launch
                launch { repository.refreshTasks() }
                launch { repository.refreshSummary() }

                // If not authenticated, request token from phone
                if (!repository.isAuthenticated()) {
                    val syncHelper = PhoneSyncHelper(context)
                    syncHelper.requestAuthToken()
                }
            }

            UnjynxWearTheme {
                WearNavHost(repository = repository)
            }
        }
    }
}
