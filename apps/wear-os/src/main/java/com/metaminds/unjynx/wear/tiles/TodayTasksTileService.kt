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
import com.metaminds.unjynx.wear.data.TaskRepository
import com.metaminds.unjynx.wear.data.UiState
import com.metaminds.unjynx.wear.data.WearTask
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.guava.future

/**
 * Today's Tasks Tile — shows up to 3 pending tasks on the watch face tile carousel.
 *
 * Each task shows its title and priority color.
 * Tapping a task launches the app to the TaskDetailScreen.
 * Auto-refreshes every 30 minutes via the tile refresh interval.
 *
 * Resource version is used for cache invalidation when tasks change.
 */
class TodayTasksTileService : androidx.wear.tiles.TileService() {

    companion object {
        private const val RESOURCES_VERSION = "today_tasks_v1"
        private const val MAX_TILE_TASKS = 3

        // UNJYNX colors as ARGB ints for tile API
        private const val COLOR_GOLD = 0xFFFFD700.toInt()
        private const val COLOR_TEXT_PRIMARY = 0xFFF8F5FF.toInt()
        private const val COLOR_TEXT_SECONDARY = 0xFFB8A8CC.toInt()
        private const val COLOR_PRIORITY_URGENT = 0xFFEF4444.toInt()
        private const val COLOR_PRIORITY_HIGH = 0xFFF97316.toInt()
        private const val COLOR_PRIORITY_MEDIUM = 0xFFEAB308.toInt()
        private const val COLOR_PRIORITY_LOW = 0xFF22C55E.toInt()
        private const val COLOR_PRIORITY_NONE = 0xFF6B7280.toInt()
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest,
    ): ListenableFuture<TileBuilders.Tile> = serviceScope.future {
        val repository = TaskRepository(applicationContext)
        repository.refreshTasks()

        val tasks = when (val state = repository.tasks.first { it !is UiState.Loading }) {
            is UiState.Success -> state.data.take(MAX_TILE_TASKS)
            else -> emptyList()
        }

        val layout = buildTileLayout(tasks)

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

    private fun buildTileLayout(tasks: List<WearTask>): LayoutElementBuilders.LayoutElement {
        val column = LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)

        // Title
        column.addContent(
            LayoutElementBuilders.Text.Builder()
                .setText("Today")
                .setFontStyle(
                    LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.SpProp.Builder().setValue(16f).build())
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .setColor(ColorBuilders.argb(COLOR_GOLD))
                        .build()
                )
                .build()
        )

        // Spacer
        column.addContent(
            LayoutElementBuilders.Spacer.Builder()
                .setHeight(DimensionBuilders.DpProp.Builder(4f).build())
                .build()
        )

        if (tasks.isEmpty()) {
            // Empty state
            column.addContent(
                LayoutElementBuilders.Text.Builder()
                    .setText("All caught up!")
                    .setFontStyle(
                        LayoutElementBuilders.FontStyle.Builder()
                            .setSize(DimensionBuilders.SpProp.Builder().setValue(12f).build())
                            .setColor(ColorBuilders.argb(COLOR_TEXT_SECONDARY))
                            .build()
                    )
                    .build()
            )
        } else {
            // Task items
            for (task in tasks) {
                column.addContent(buildTaskRow(task))
                column.addContent(
                    LayoutElementBuilders.Spacer.Builder()
                        .setHeight(DimensionBuilders.DpProp.Builder(3f).build())
                        .build()
                )
            }
        }

        return LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHeight(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(column.build())
            .build()
    }

    private fun buildTaskRow(task: WearTask): LayoutElementBuilders.LayoutElement {
        val priorityColor = when (task.priority) {
            com.metaminds.unjynx.wear.data.TaskPriority.URGENT -> COLOR_PRIORITY_URGENT
            com.metaminds.unjynx.wear.data.TaskPriority.HIGH -> COLOR_PRIORITY_HIGH
            com.metaminds.unjynx.wear.data.TaskPriority.MEDIUM -> COLOR_PRIORITY_MEDIUM
            com.metaminds.unjynx.wear.data.TaskPriority.LOW -> COLOR_PRIORITY_LOW
            com.metaminds.unjynx.wear.data.TaskPriority.NONE -> COLOR_PRIORITY_NONE
        }

        val row = LayoutElementBuilders.Row.Builder()
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)

        // Priority dot (small colored box with rounded corners)
        row.addContent(
            LayoutElementBuilders.Box.Builder()
                .setWidth(DimensionBuilders.DpProp.Builder(6f).build())
                .setHeight(DimensionBuilders.DpProp.Builder(6f).build())
                .setModifiers(
                    ModifiersBuilders.Modifiers.Builder()
                        .setBackground(
                            ModifiersBuilders.Background.Builder()
                                .setColor(ColorBuilders.argb(priorityColor))
                                .setCorner(
                                    ModifiersBuilders.Corner.Builder()
                                        .setRadius(DimensionBuilders.DpProp.Builder(3f).build())
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .build()
        )

        // Spacer between dot and text
        row.addContent(
            LayoutElementBuilders.Spacer.Builder()
                .setWidth(DimensionBuilders.DpProp.Builder(6f).build())
                .build()
        )

        // Task title (truncated to fit watch screen)
        val displayTitle = if (task.title.length > 22) {
            task.title.take(20) + "..."
        } else {
            task.title
        }

        row.addContent(
            LayoutElementBuilders.Text.Builder()
                .setText(displayTitle)
                .setFontStyle(
                    LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.SpProp.Builder().setValue(12f).build())
                        .setColor(ColorBuilders.argb(COLOR_TEXT_PRIMARY))
                        .build()
                )
                .setMaxLines(1)
                .build()
        )

        // Wrap row in a clickable box that launches the app with taskId
        return LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.ExpandedDimensionProp.Builder().build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_START)
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setClickable(
                        ModifiersBuilders.Clickable.Builder()
                            .setId("task_${task.id}")
                            .setOnClick(
                                ActionBuilders.LaunchAction.Builder()
                                    .setAndroidActivity(
                                        ActionBuilders.AndroidActivity.Builder()
                                            .setPackageName("com.metaminds.unjynx.wear")
                                            .setClassName("com.metaminds.unjynx.wear.MainActivity")
                                            .addKeyToExtraMapping(
                                                "taskId",
                                                ActionBuilders.AndroidStringExtra.Builder()
                                                    .setValue(task.id)
                                                    .build()
                                            )
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    )
                    .setPadding(
                        ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.DpProp.Builder(12f).build())
                            .setEnd(DimensionBuilders.DpProp.Builder(12f).build())
                            .setTop(DimensionBuilders.DpProp.Builder(4f).build())
                            .setBottom(DimensionBuilders.DpProp.Builder(4f).build())
                            .build()
                    )
                    .build()
            )
            .addContent(row.build())
            .build()
    }
}
