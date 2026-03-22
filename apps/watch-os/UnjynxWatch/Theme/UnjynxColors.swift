import SwiftUI

// MARK: - UNJYNX Brand Colors

extension Color {
    /// Primary dark background — OLED black with purple undertone.
    static let unjynxMidnight = Color(hex: "0F0A1A")

    /// Deep purple for card backgrounds and subtle surfaces.
    static let unjynxDeepPurple = Color(hex: "1A0533")

    /// Primary accent violet.
    static let unjynxViolet = Color(hex: "6B21A8")

    /// Gold for CTAs, streaks, and emphasis.
    static let unjynxGold = Color(hex: "FFD700")

    /// Emerald for habits ring and success states.
    static let unjynxEmerald = Color(hex: "10B981")

    /// Amber for warnings and medium priority.
    static let unjynxAmber = Color(hex: "F59E0B")

    /// Rose for urgent priority and destructive actions.
    static let unjynxRose = Color(hex: "F43F5E")

    /// Lighter violet for secondary text and borders.
    static let unjynxLavender = Color(hex: "A78BFA")

    /// Muted text on dark backgrounds.
    static let unjynxMutedText = Color(hex: "9CA3AF")
}

// MARK: - Hex Color Initializer

extension Color {
    /// Creates a Color from a hex string (supports 6 or 8 character hex).
    ///
    /// - Parameter hex: A hex color string, optionally prefixed with "#".
    init(hex: String) {
        let sanitized = hex
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: sanitized).scanHexInt64(&rgb)

        let red: Double
        let green: Double
        let blue: Double
        let opacity: Double

        if sanitized.count == 8 {
            red = Double((rgb >> 24) & 0xFF) / 255.0
            green = Double((rgb >> 16) & 0xFF) / 255.0
            blue = Double((rgb >> 8) & 0xFF) / 255.0
            opacity = Double(rgb & 0xFF) / 255.0
        } else {
            red = Double((rgb >> 16) & 0xFF) / 255.0
            green = Double((rgb >> 8) & 0xFF) / 255.0
            blue = Double(rgb & 0xFF) / 255.0
            opacity = 1.0
        }

        self.init(
            .sRGB,
            red: red,
            green: green,
            blue: blue,
            opacity: opacity
        )
    }
}

// MARK: - Brand Gradients

extension LinearGradient {
    /// Gold shimmer gradient for CTAs and streaks.
    static let unjynxGoldShimmer = LinearGradient(
        colors: [Color.unjynxGold, Color(hex: "FFA500")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Violet depth gradient for card backgrounds.
    static let unjynxVioletDepth = LinearGradient(
        colors: [Color.unjynxDeepPurple, Color.unjynxMidnight],
        startPoint: .top,
        endPoint: .bottom
    )

    /// Flame gradient for streak animations.
    static let unjynxFlame = LinearGradient(
        colors: [Color.unjynxGold, Color(hex: "FF6B00"), Color.unjynxRose],
        startPoint: .top,
        endPoint: .bottom
    )
}
