/// UNJYNX Home Hub Feature Plugin.
///
/// Provides the command center of the app including:
/// - Greeting bar with user name and streak
/// - Progress rings for tasks, focus, and habits
/// - Daily content card (quotes, wisdom)
/// - Today's tasks section
/// - Quick actions row
/// - Upcoming tasks preview
/// - Ghost Mode (anti-overwhelm, one-task-at-a-time view)
/// - Calendar view with month/week toggle and task indicators
library;

export 'src/calendar_plugin_impl.dart';
export 'src/domain/services/ambient_sound_service.dart';
export 'src/home_plugin_impl.dart';
export 'src/presentation/pages/apple_calendar_connect_page.dart';
export 'src/presentation/pages/calendar_page.dart';
export 'src/presentation/pages/category_selector_page.dart';
export 'src/presentation/pages/content_feed_page.dart';
export 'src/presentation/pages/evening_review_page.dart';
export 'src/presentation/pages/ghost_mode_page.dart';
export 'src/presentation/pages/google_calendar_connect_page.dart';
export 'src/presentation/pages/home_page.dart';
export 'src/presentation/pages/outlook_connect_page.dart';
export 'src/presentation/pages/morning_ritual_page.dart';
export 'src/presentation/pages/pomodoro_page.dart';
export 'src/presentation/pages/progress_hub_page.dart';
export 'src/presentation/pages/time_blocking_page.dart';
export 'src/presentation/pages/weekly_review_page.dart';
export 'src/presentation/providers/home_providers.dart';
export 'src/presentation/utils/share_content_card.dart';
export 'src/presentation/widgets/activity_heatmap.dart';
export 'src/presentation/widgets/breathing_text.dart';
export 'src/presentation/widgets/calendar_connect_card.dart';
export 'src/presentation/widgets/completion_momentum_card.dart';
export 'src/presentation/widgets/future_self_projection.dart';
export 'src/presentation/widgets/calendar_grid.dart';
export 'src/presentation/widgets/content_category_card.dart';
export 'src/presentation/widgets/daily_content_card.dart';
export 'src/presentation/widgets/day_task_list.dart';
export 'src/presentation/widgets/greeting_bar.dart';
export 'src/presentation/widgets/mood_slider.dart';
export 'src/presentation/widgets/personal_bests_card.dart';
export 'src/presentation/widgets/progress_rings.dart';
export 'src/presentation/widgets/quick_actions_row.dart';
export 'src/presentation/widgets/ritual_step_indicator.dart';
export 'src/presentation/widgets/shareable_content_card.dart';
export 'src/presentation/widgets/social_proof_counter.dart';
export 'src/presentation/widgets/streak_at_risk_banner.dart';
export 'src/presentation/widgets/streak_counter.dart';
export 'src/presentation/widgets/timer_ring.dart';
export 'src/presentation/widgets/today_tasks_section.dart';
export 'src/presentation/widgets/upcoming_preview.dart';
export 'src/presentation/widgets/weekly_insights_card.dart';
