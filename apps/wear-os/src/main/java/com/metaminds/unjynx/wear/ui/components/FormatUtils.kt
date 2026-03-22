package com.metaminds.unjynx.wear.ui.components

import java.time.LocalDateTime
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit

/**
 * Date/time formatting utilities for compact watch display.
 */
object FormatUtils {

    private val TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a")
    private val SHORT_DATE = DateTimeFormatter.ofPattern("MMM d")

    /**
     * Format an ISO 8601 datetime string into a compact watch-friendly format.
     * Returns relative time if within 24 hours, otherwise short date.
     */
    fun formatDueTime(isoDateTime: String?): String {
        if (isoDateTime == null) return ""

        return try {
            val dateTime = try {
                ZonedDateTime.parse(isoDateTime).toLocalDateTime()
            } catch (_: DateTimeParseException) {
                LocalDateTime.parse(isoDateTime)
            }

            val now = LocalDateTime.now()
            val minutesUntil = ChronoUnit.MINUTES.between(now, dateTime)
            val hoursUntil = ChronoUnit.HOURS.between(now, dateTime)

            when {
                minutesUntil < 0 -> "Overdue"
                minutesUntil < 60 -> "${minutesUntil}m"
                hoursUntil < 24 -> dateTime.format(TIME_FORMAT)
                else -> dateTime.format(SHORT_DATE)
            }
        } catch (_: Exception) {
            ""
        }
    }

    /**
     * Format percentage as "XX%" — clamped to 0-100.
     */
    fun formatPercent(completed: Int, total: Int): String {
        if (total <= 0) return "0%"
        val pct = ((completed.toFloat() / total) * 100).toInt().coerceIn(0, 100)
        return "$pct%"
    }

    /**
     * Calculate completion fraction (0.0 to 1.0).
     */
    fun completionFraction(completed: Int, total: Int): Float {
        if (total <= 0) return 0f
        return (completed.toFloat() / total).coerceIn(0f, 1f)
    }
}
