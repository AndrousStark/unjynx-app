package com.metaminds.unjynx.wear.ui.theme

import androidx.compose.ui.graphics.Color

// UNJYNX Brand Colors — OLED-optimized for Wear OS
object UnjynxColors {
    // Primary brand
    val MidnightPurple = Color(0xFF0F0A1A)
    val ElectricGold = Color(0xFFFFD700)
    val VioletAccent = Color(0xFF6B21A8)
    val VioletLight = Color(0xFF9333EA)
    val VioletDark = Color(0xFF4C1D95)

    // Surface hierarchy (dark to light for depth)
    val SurfaceBase = Color(0xFF000000)       // True black — OLED power saving
    val SurfaceElevated = Color(0xFF0F0A1A)   // Midnight purple — cards
    val SurfaceOverlay = Color(0xFF1A1128)     // Slightly lighter — dialogs
    val SurfaceDim = Color(0xFF241B33)         // Dimmed surface — hover states

    // Priority colors (consistent with mobile app)
    val PriorityUrgent = Color(0xFFEF4444)    // Red
    val PriorityHigh = Color(0xFFF97316)      // Orange
    val PriorityMedium = Color(0xFFEAB308)    // Yellow
    val PriorityLow = Color(0xFF22C55E)       // Green
    val PriorityNone = Color(0xFF6B7280)      // Gray

    // Progress ring colors
    val RingTasks = ElectricGold
    val RingFocus = VioletLight
    val RingHabits = Color(0xFF10B981)        // Emerald

    // Text
    val TextPrimary = Color(0xFFF8F5FF)       // Near-white with slight purple tint
    val TextSecondary = Color(0xFFB8A8CC)     // Muted lavender
    val TextTertiary = Color(0xFF7C6C94)      // Dimmed
    val TextOnGold = Color(0xFF0F0A1A)        // Dark text on gold buttons

    // Functional
    val Success = Color(0xFF22C55E)
    val Error = Color(0xFFEF4444)
    val Warning = Color(0xFFF59E0B)
}
