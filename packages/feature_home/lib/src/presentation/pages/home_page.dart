import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/completion_momentum_card.dart';
import 'package:feature_home/src/presentation/widgets/daily_content_card.dart';
import 'package:feature_home/src/presentation/widgets/greeting_bar.dart';
import 'package:feature_home/src/presentation/widgets/progress_rings.dart';
import 'package:feature_home/src/presentation/widgets/quick_actions_row.dart';
import 'package:feature_home/src/presentation/widgets/social_proof_counter.dart';
import 'package:feature_home/src/presentation/widgets/streak_at_risk_banner.dart';
import 'package:feature_home/src/presentation/widgets/today_tasks_section.dart';
import 'package:feature_home/src/presentation/widgets/upcoming_preview.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// The main home screen -- UNJYNX command center.
///
/// A full-bleed scrollable page with no AppBar (the [GreetingBar] serves
/// as the header). Composed of six premium widgets laid out in a
/// [CustomScrollView] with [SliverPadding].
///
/// Pull-to-refresh invalidates all home providers to fetch fresh data.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: ux.gold,
          backgroundColor: colorScheme.surface,
          onRefresh: () async {
            ref
              ..invalidate(homeTodayTasksProvider)
              ..invalidate(homeUpcomingTasksProvider)
              ..invalidate(homeProgressRingsProvider)
              ..invalidate(homeDailyContentProvider)
              ..invalidate(homeStreakProvider);
          },
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                sliver: SliverList.list(
                  children: const [
                    GreetingBar(),
                    SizedBox(height: 24),

                    // Retention Hook #1: Streak at risk (after 6 PM).
                    StreakAtRiskBanner(),

                    ProgressRings(),
                    SizedBox(height: 20),
                    DailyContentCard(),
                    SizedBox(height: 20),
                    QuickActionsRow(),
                    SizedBox(height: 24),

                    // Retention Hook #5: Completion momentum.
                    CompletionMomentumCard(),

                    TodayTasksSection(),
                    SizedBox(height: 24),
                    UpcomingPreview(),
                    SizedBox(height: 16),

                    // Retention Hook #9: Social proof counter.
                    SocialProofCounter(),

                    SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
