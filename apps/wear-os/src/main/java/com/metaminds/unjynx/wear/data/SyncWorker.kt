package com.metaminds.unjynx.wear.data

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Background worker that periodically refreshes tasks and summary.
 *
 * Runs every 15 minutes (WorkManager minimum) with network constraint.
 * On Wear OS, WorkManager is battery-aware and will batch with other work.
 */
class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        private const val WORK_NAME = "unjynx_sync_worker"

        /**
         * Schedule the periodic sync worker.
         * Uses KEEP policy — won't replace existing schedule.
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<SyncWorker>(
                repeatInterval = 15,
                repeatIntervalTimeUnit = TimeUnit.MINUTES,
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    1,
                    TimeUnit.MINUTES,
                )
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest,
            )
        }

        /**
         * Cancel the periodic sync worker.
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }

    override suspend fun doWork(): Result {
        val repository = TaskRepository(applicationContext)

        if (!repository.isAuthenticated()) {
            return Result.success() // Nothing to sync without auth
        }

        return try {
            repository.refreshTasks()
            repository.refreshSummary()
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
