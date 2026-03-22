package com.metaminds.unjynx.wear.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ColorScheme

/**
 * UNJYNX Wear OS theme — always dark (OLED battery optimization).
 *
 * Watches do not support light themes; all surfaces use true black or
 * near-black midnight purple for maximum power efficiency on AMOLED panels.
 */

// Composition locals for extended UNJYNX colors not covered by Material 3
data class UnjynxExtendedColors(
    val gold: androidx.compose.ui.graphics.Color = UnjynxColors.ElectricGold,
    val violet: androidx.compose.ui.graphics.Color = UnjynxColors.VioletAccent,
    val violetLight: androidx.compose.ui.graphics.Color = UnjynxColors.VioletLight,
    val priorityUrgent: androidx.compose.ui.graphics.Color = UnjynxColors.PriorityUrgent,
    val priorityHigh: androidx.compose.ui.graphics.Color = UnjynxColors.PriorityHigh,
    val priorityMedium: androidx.compose.ui.graphics.Color = UnjynxColors.PriorityMedium,
    val priorityLow: androidx.compose.ui.graphics.Color = UnjynxColors.PriorityLow,
    val priorityNone: androidx.compose.ui.graphics.Color = UnjynxColors.PriorityNone,
    val ringTasks: androidx.compose.ui.graphics.Color = UnjynxColors.RingTasks,
    val ringFocus: androidx.compose.ui.graphics.Color = UnjynxColors.RingFocus,
    val ringHabits: androidx.compose.ui.graphics.Color = UnjynxColors.RingHabits,
    val textOnGold: androidx.compose.ui.graphics.Color = UnjynxColors.TextOnGold,
)

val LocalUnjynxColors = staticCompositionLocalOf { UnjynxExtendedColors() }

private val UnjynxDarkColorScheme = ColorScheme(
    primary = UnjynxColors.ElectricGold,
    onPrimary = UnjynxColors.TextOnGold,
    primaryContainer = UnjynxColors.VioletDark,
    onPrimaryContainer = UnjynxColors.TextPrimary,
    secondary = UnjynxColors.VioletLight,
    onSecondary = UnjynxColors.TextPrimary,
    secondaryContainer = UnjynxColors.VioletDark,
    onSecondaryContainer = UnjynxColors.TextPrimary,
    tertiary = UnjynxColors.RingHabits,
    onTertiary = UnjynxColors.TextOnGold,
    surface = UnjynxColors.SurfaceBase,
    onSurface = UnjynxColors.TextPrimary,
    onSurfaceVariant = UnjynxColors.TextSecondary,
    error = UnjynxColors.Error,
    onError = UnjynxColors.TextPrimary,
    background = UnjynxColors.SurfaceBase,
    onBackground = UnjynxColors.TextPrimary,
)

@Composable
fun UnjynxWearTheme(
    content: @Composable () -> Unit,
) {
    val extendedColors = UnjynxExtendedColors()

    CompositionLocalProvider(LocalUnjynxColors provides extendedColors) {
        MaterialTheme(
            colorScheme = UnjynxDarkColorScheme,
        ) {
            content()
        }
    }
}
