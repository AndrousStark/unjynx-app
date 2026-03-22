package com.metaminds.unjynx.wear.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * Compact typography for Wear OS.
 *
 * Watch screens are 1.1"–1.4", so everything is scaled down from phone sizes.
 * We use system fonts as fallback since custom font files would bloat the APK.
 * When custom fonts are bundled, replace FontFamily.Default with the named families.
 */
object UnjynxTypography {

    // Heading font — Outfit equivalent (geometric sans-serif)
    // Use FontFamily.Default until custom font resources are added
    private val HeadingFamily = FontFamily.Default

    // Body font — DM Sans equivalent (clean sans-serif)
    private val BodyFamily = FontFamily.Default

    // Display font — Bebas Neue equivalent (condensed uppercase)
    private val DisplayFamily = FontFamily.Default

    // Large display number (streak count, ring percentage)
    val displayLarge = TextStyle(
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 40.sp,
        lineHeight = 44.sp,
        letterSpacing = 1.sp,
    )

    // Screen title
    val titleLarge = TextStyle(
        fontFamily = HeadingFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 22.sp,
        letterSpacing = 0.sp,
    )

    // Card title / task name
    val titleMedium = TextStyle(
        fontFamily = HeadingFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.1.sp,
    )

    // Subtitle / secondary info
    val titleSmall = TextStyle(
        fontFamily = HeadingFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.1.sp,
    )

    // Body text
    val bodyMedium = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 17.sp,
        letterSpacing = 0.2.sp,
    )

    // Small body / timestamps
    val bodySmall = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.3.sp,
    )

    // Button label
    val labelLarge = TextStyle(
        fontFamily = HeadingFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.1.sp,
    )

    // Chip / badge label
    val labelSmall = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        lineHeight = 13.sp,
        letterSpacing = 0.4.sp,
    )
}
