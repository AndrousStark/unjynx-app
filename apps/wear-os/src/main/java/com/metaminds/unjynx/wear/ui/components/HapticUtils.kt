package com.metaminds.unjynx.wear.ui.components

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Haptic feedback utilities for Wear OS interactions.
 *
 * Every tappable element should trigger haptics for physical confirmation
 * on a device with no visual keyboard and tiny touch targets.
 */
object HapticUtils {

    private fun getVibrator(context: Context): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            manager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    /** Light tap — for list item taps, navigation */
    fun lightImpact(context: Context) {
        val vibrator = getVibrator(context)
        vibrator.vibrate(
            VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE)
        )
    }

    /** Medium impact — for button presses, confirmations */
    fun mediumImpact(context: Context) {
        val vibrator = getVibrator(context)
        vibrator.vibrate(
            VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE)
        )
    }

    /** Selection click — for toggles, checkboxes */
    fun selectionClick(context: Context) {
        val vibrator = getVibrator(context)
        vibrator.vibrate(
            VibrationEffect.createOneShot(10, 80)
        )
    }

    /** Success — for task completion */
    fun successFeedback(context: Context) {
        val vibrator = getVibrator(context)
        vibrator.vibrate(
            VibrationEffect.createWaveform(
                longArrayOf(0, 30, 50, 30),
                intArrayOf(0, 120, 0, 180),
                -1,
            )
        )
    }
}
