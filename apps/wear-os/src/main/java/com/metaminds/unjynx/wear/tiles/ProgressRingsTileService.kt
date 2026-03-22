package com.metaminds.unjynx.wear.tiles

import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TimelineBuilders
import androidx.wear.tiles.LayoutElementBuilders
import androidx.wear.tiles.DimensionBuilders
import androidx.wear.tiles.ColorBuilders
import androidx.wear.tiles.ModifiersBuilders
import androidx.wear.tiles.ActionBuilders
import androidx.wear.tiles.ResourceBuilders
import com.google.common.util.concurrent.ListenableFuture
import com.metaminds.unjynx.wear.data.DaySummary
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.UiState
import com.metaminds.unjynx.wear.ui.components.FormatUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.guava.future

/**
 * Progress Rings Tile — compact ring visualization on the tile carousel.
 *
 * Shows overall completion percentage and a mini summary.
 * Tapping opens the full ProgressRingsScreen in the app.
 * Auto-refreshes every 30 minutes.
 *
 * Note: The Tiles API does not support Canvas drawing, so we display
 * percentage and colored stat text as an approximation of the ring view.
 */
class ProgressRingsTileService : androidx.wear.tiles.TileService() {

    companion object {
        private const val RESOURCES_VERSION = "progress_rings_v1"

        // UNJYNX colors
        private const val COLOR_GOLD = 0xFFFFD700.toInt()
        private const val COLOR_VIOLET = 0xFF9333EA.toInt()
        private const val COLOR_EMERALD = 0xFF10B981.toInt()
        private const val COLOR_TEXT_PRIMARY = 0xFFF8F5FF.toInt()
        private const val COLOR_TEXT_TERTIARY = 0xFF7C6C94.toInt()
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest,
    ): ListenableFuture<TileBuilders.Tile> = serviceScope.future {
        val repository = TaskRepository(applicationContext)
        repository.refreshSummary()

        val summary = when (val state = repository.summary.first { it !is UiState.Loading }) {
            is UiState.Success -> state.data
            else -> DaySummary()
        }

        val layout = buildTileLayout(summary)

        TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setFreshnessIntervalMillis(30 * 60 * 1000L) // 30 minutes
            .setTileTimeline(
                TimelineBuilders.Timeline.Builder()
                    .addTimelineEntry(
                        TimelineBuilders.TimelineEntry.Builder()
                            .setLayout(
                                LayoutElementBuilders.Layout.Builder()
                                    .setRoot(layout)
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build()
    }

    override fun onTileResourcesRequest(
        requestParams: RequestBuilders.ResourcesRequest,
    ): ListenableFuture<ResourceBuilders.Resources> = serviceScope.future {
        ResourceBuilders.Resources.Builder()
            .setVersion(RESOURCES_VERSION)
            .build()
    }

    private fun buildTileLayout(summary: DaySummary): LayoutElementBuilders.LayoutElement {
        val taskPct = FormatUtils.completionFraction(summary.completedTasks, summary.totalTasks)
        val focusPct = FormatUtils.completionFraction(summary.focusMinutes, summary.focusGoalMinutes)
        val habitPct = FormatUtils.completionFraction(summary.habitsCompleted, summary.habitsTotal)

        // Overall percentage
        val weights = listOfNotNull(
            if (summary.totalTasks > 0) taskPct else null,
            if (summary.focusGoalMinutes > 0) focusPct else null,
            if (summary.habitsTotal > 0) habitPct else null,
        )
        val overallPct = if (weights.isNotEmpty()) {
            ((weights.sum() / weights.size) * 100).toInt().coerceIn(0, 100)
        } else 0

        val content = LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)

        // Large percentage
        content.addContent(
            LayoutElementBuilders.Text.Builder()
                .setText("$overallPct%")
                .setFontStyle(
                    LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.SpProp.Builder().setValue(32f).build())
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .setColor(ColorBuilders.argb(COLOR_TEXT_PRIMARY))
                        .build()
                )
                .build()
        )

        content.addContent(spacer(2f))

        // "today" label
        content.addContent(
            LayoutElementBuilders.Text.Builder()
                .setText("today")
                .setFontStyle(
                    LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.SpProp.Builder().setValue(11f).build())
                        .setColor(ColorBuilders.argb(COLOR_TEXT_TERTIARY))
                        .build()
                )
                .build()
        )

        content.addContent(spacer(6f))

        // Colored stat lines
        content.addContent(coloredText("${summary.completedTasks}/${summary.totalTasks} tasks", COLOR_GOLD))
        content.addContent(coloredText("${summary.focusMinutes}m focus", COLOR_VIOLET))
        content.addContent(coloredText("${summary.habitsCompleted}/${summary.habitsTotal} habits", COLOR_EMERALD))

        // Wrap in a clickable box that opens the app to progress screen
        return LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHeight(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setClickable(
                        ModifiersBuilders.Clickable.Builder()
                            .setId("open_progress")
                            .setOnClick(
                                ActionBuilders.LaunchAction.Builder()
                                    .setAndroidActivity(
                                        ActionBuilders.AndroidActivity.Builder()
                                            .setPackageName("com.metaminds.unjynx.wear")
                                            .setClassName("com.metaminds.unjynx.wear.MainActivity")
                                            .addKeyToExtraMapping(
                                                "screen",
                                                ActionBuilders.AndroidStringExtra.Builder()
                                                    .setValue("progress_rings")
                                                    .build()
                                            )
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .addContent(content.build())
            .build()
    }

    private fun spacer(heightDp: Float): LayoutElementBuilders.LayoutElement =
        LayoutElementBuilders.Spacer.Builder()
            .setHeight(DimensionBuilders.DpProp.Builder(heightDp).build())
            .build()

    private fun coloredText(text: String, color: Int): LayoutElementBuilders.LayoutElement =
        LayoutElementBuilders.Text.Builder()
            .setText(text)
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(DimensionBuilders.SpProp.Builder().setValue(10f).build())
                    .setColor(ColorBuilders.argb(color))
                    .build()
            )
            .build()
}
