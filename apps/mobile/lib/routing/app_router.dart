import 'package:feature_ai/feature_ai.dart';
import 'package:feature_billing/feature_billing.dart';
import 'package:feature_gamification/feature_gamification.dart';
import 'package:feature_goals/feature_goals.dart';
import 'package:feature_messaging/feature_messaging.dart';
import 'package:feature_home/feature_home.dart';
import 'package:feature_import_export/feature_import_export.dart';
import 'package:feature_notifications/feature_notifications.dart';
import 'package:feature_projects/feature_projects.dart';
import 'package:feature_settings/feature_settings.dart';
import 'package:feature_sprints/feature_sprints.dart';
import 'package:feature_team/feature_team.dart';
import 'package:feature_team/src/presentation/widgets/org_switcher.dart';
import 'package:feature_team/src/presentation/pages/org_onboarding_page.dart';
import 'package:feature_todos/todo_plugin.dart';
import 'package:feature_widgets/feature_widgets.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_mobile/config/app_config.dart';
import 'package:service_auth/service_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import 'package:unjynx_mobile/firebase/firebase_init.dart';
import 'package:unjynx_mobile/providers/connectivity_provider.dart';

/// Global navigator key used by GoRouter.
///
/// Exposed so that non-widget code (e.g. notification tap handlers) can
/// push routes without needing a BuildContext.
final rootNavigatorKey = GlobalKey<NavigatorState>();

/// Creates the app router by collecting routes from all registered plugins.
///
/// [isOnboardingComplete] controls the redirect guard that sends first-time
/// users to the onboarding flow.
GoRouter createAppRouter(
  PluginRegistry registry, {
  required bool isOnboardingComplete,
  bool isAuthenticated = true,
  bool isOrgOnboardingNeeded = false,
}) {
  // Only show nav-worthy routes in bottom bar:
  // - Exclude onboarding routes
  // - Exclude utility routes (sortOrder < 0) like /projects/create, /profile/edit
  final navRoutes = registry.allRoutes
      .where((r) => !r.path.startsWith('/onboarding') && r.sortOrder >= 0)
      .toList();

  final allRoutes = registry.allRoutes;

  final routes = <RouteBase>[
    // Login route (full-screen, no shell)
    GoRoute(
      path: '/login',
      builder: (context, state) =>
          LoginPage(redirectTo: state.uri.queryParameters['redirect']),
    ),

    // Forgot password route (full-screen, no shell)
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPage(),
    ),

    // Email verification (shown after registration)
    GoRoute(
      path: '/verify-email',
      builder: (context, state) => EmailVerificationPage(
        email: state.uri.queryParameters['email'] ?? '',
      ),
    ),

    // Invite accept (deep link: unjynx://invite/{code})
    GoRoute(
      path: '/invite/:code',
      builder: (context, state) =>
          InviteAcceptPage(inviteCode: state.pathParameters['code']!),
    ),

    // Onboarding routes (full-screen, no shell)
    for (final route in allRoutes.where(
      (r) => r.path.startsWith('/onboarding'),
    ))
      GoRoute(path: route.path, builder: (context, state) => route.builder()),

    // Org onboarding (industry selector — first login after signup)
    GoRoute(
      path: '/org-onboarding',
      builder: (context, state) => const OrgOnboardingPage(),
    ),

    // Shell route with bottom navigation
    // Include all non-onboarding plugin routes in shell (so they render with
    // the bottom nav), but only show navRoutes (sortOrder >= 0) in the bar.
    ShellRoute(
      builder: (context, state, child) {
        return _AppShell(pluginRoutes: navRoutes, child: child);
      },
      routes: [
        for (final route in allRoutes.where(
          (r) => !r.path.startsWith('/onboarding'),
        ))
          GoRoute(
            path: route.path,
            builder: (context, state) => route.builder(),
          ),
      ],
    ),

    // Detail routes (full-screen, outside shell/bottom nav)
    GoRoute(
      path: '/todos/:id',
      builder: (context, state) =>
          TodoDetailPage(todoId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/projects/:id',
      builder: (context, state) =>
          ProjectDetailPage(projectId: state.pathParameters['id']!),
    ),

    // Kanban Board (full-screen, outside shell)
    GoRoute(
      path: '/kanban',
      builder: (context, state) => const KanbanBoardPage(),
    ),

    // Timeline/Gantt view (full-screen, outside shell)
    GoRoute(
      path: '/timeline',
      builder: (context, state) => const TimelinePage(),
    ),

    // Spreadsheet table view (full-screen, outside shell)
    GoRoute(path: '/table', builder: (context, state) => const TableViewPage()),

    // Content Feed (full-screen, outside shell)
    GoRoute(
      path: '/content',
      builder: (context, state) => const ContentFeedPage(),
    ),

    // Category Selector (full-screen, outside shell)
    GoRoute(
      path: '/content/categories',
      builder: (context, state) => const CategorySelectorPage(),
    ),

    // Progress Hub (full-screen, outside shell)
    GoRoute(
      path: '/progress',
      builder: (context, state) => const ProgressHubPage(),
    ),

    // Ghost Mode (full-screen, outside shell)
    GoRoute(
      path: '/ghost-mode',
      builder: (context, state) => const GhostModePage(),
    ),

    // Pomodoro Focus Timer (full-screen, outside shell)
    GoRoute(
      path: '/pomodoro',
      builder: (context, state) => const PomodoroPage(),
    ),

    // Time Blocking (full-screen, Pro feature, outside shell)
    GoRoute(
      path: '/calendar/time-blocking',
      builder: (context, state) => const TimeBlockingPage(),
    ),

    // Calendar connect pages (full-screen, outside shell)
    GoRoute(
      path: '/calendar/connect/google',
      builder: (context, state) => const GoogleCalendarConnectPage(),
    ),
    GoRoute(
      path: '/calendar/connect/apple',
      builder: (context, state) => const AppleCalendarConnectPage(),
    ),
    GoRoute(
      path: '/calendar/connect/outlook',
      builder: (context, state) => const OutlookConnectPage(),
    ),

    // Weekly Review (full-screen, outside shell)
    GoRoute(
      path: '/weekly-review',
      builder: (context, state) => const WeeklyReviewPage(),
    ),

    // Rituals (full-screen, outside shell)
    GoRoute(
      path: '/rituals/morning',
      builder: (context, state) => const MorningRitualPage(),
    ),
    GoRoute(
      path: '/rituals/evening',
      builder: (context, state) => const EveningReviewPage(),
    ),

    // Notification screens (J1-J6)
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationHubPage(),
    ),
    GoRoute(
      path: '/notifications/channels',
      builder: (context, state) => const ChannelSetupPage(),
    ),
    GoRoute(
      path: '/notifications/escalation',
      builder: (context, state) => const EscalationChainPage(),
    ),
    GoRoute(
      path: '/notifications/quiet-hours',
      builder: (context, state) => const QuietHoursPage(),
    ),
    GoRoute(
      path: '/notifications/test',
      builder: (context, state) => const TestNotificationPage(),
    ),
    GoRoute(
      path: '/notifications/history',
      builder: (context, state) => const NotificationHistoryPage(),
    ),

    // Gamification screens (I2-I4)
    GoRoute(
      path: '/gamification/dashboard',
      builder: (context, state) => const ProgressDashboardPage(),
    ),
    GoRoute(
      path: '/gamification/accountability',
      builder: (context, state) => const AccountabilityPage(),
    ),
    GoRoute(
      path: '/gamification/game-mode',
      builder: (context, state) => const GameModePage(),
    ),

    // Billing screens (M2)
    GoRoute(path: '/billing', builder: (context, state) => const BillingPage()),
    GoRoute(
      path: '/billing/compare',
      builder: (context, state) => const PlanComparisonPage(),
    ),

    // Team screens (N1-N5) — only when feature flag is enabled
    if (AppConfig.featureTeam) ...[
      GoRoute(
        path: '/team',
        builder: (context, state) => const TeamDashboardPage(),
      ),
      GoRoute(
        path: '/team/members',
        builder: (context, state) => const TeamMembersPage(),
      ),
      GoRoute(
        path: '/team/shared-project',
        builder: (context, state) => const SharedProjectPage(),
      ),
      GoRoute(
        path: '/team/reports',
        builder: (context, state) => const TeamReportsPage(),
      ),
      GoRoute(
        path: '/team/standup',
        builder: (context, state) => const AsyncStandupPage(),
      ),
    ],

    // Import/Export screens — only when feature flag is enabled
    if (AppConfig.featureImportExport) ...[
      GoRoute(path: '/import', builder: (context, state) => const ImportPage()),
      GoRoute(path: '/export', builder: (context, state) => const ExportPage()),
    ],

    // Widget configuration — only when feature flag is enabled
    if (AppConfig.featureWidgets)
      GoRoute(
        path: '/widgets',
        builder: (context, state) => const WidgetConfigPage(),
      ),

    // Industry Mode selector
    GoRoute(
      path: '/settings/mode',
      builder: (context, state) => const ModeSelectorPage(),
    ),

    // AI screens (K1-K3)
    GoRoute(path: '/ai/chat', builder: (context, state) => const AiChatPage()),
    GoRoute(
      path: '/ai/schedule',
      builder: (context, state) => const AiSchedulePage(),
    ),
    GoRoute(
      path: '/ai/insights',
      builder: (context, state) => const AiInsightsPage(),
    ),

    // Messaging (Phase 9)
    GoRoute(
      path: '/messaging',
      builder: (context, state) => const ChannelListPage(),
    ),
    GoRoute(
      path: '/messaging/:channelId',
      builder: (context, state) =>
          ChatPage(channelId: state.pathParameters['channelId']!),
    ),

    // AI Team dashboard (Sprint 4)
    GoRoute(path: '/ai-team', builder: (context, state) => const AiTeamPage()),

    // Custom fields settings (Sprint 4)
    GoRoute(
      path: '/settings/fields',
      builder: (context, state) => const CustomFieldsPage(),
    ),

    // Workflow builder (Sprint 4)
    GoRoute(
      path: '/settings/workflows',
      builder: (context, state) => const WorkflowBuilderPage(),
    ),

    // Sprint screens (Phase 7)
    GoRoute(
      path: '/sprints',
      builder: (context, state) => const SprintBoardPage(),
    ),
    GoRoute(
      path: '/sprints/create',
      builder: (context, state) => const CreateSprintPage(),
    ),
    GoRoute(
      path: '/sprints/velocity',
      builder: (context, state) => const VelocityPage(),
    ),
    GoRoute(
      path: '/sprints/:id',
      builder: (context, state) =>
          SprintDetailPage(sprintId: state.pathParameters['id']!),
    ),

    // Goal screens (Phase 7)
    GoRoute(path: '/goals', builder: (context, state) => const GoalTreePage()),
    GoRoute(
      path: '/goals/create',
      builder: (context, state) => const CreateGoalPage(),
    ),

    // Org-level reports (Phase 7)
    GoRoute(
      path: '/reports',
      builder: (context, state) => const OrgReportsPage(),
    ),
  ];

  // If no plugins registered yet, add a placeholder
  if (navRoutes.isEmpty) {
    routes.add(
      GoRoute(path: '/', builder: (context, state) => const _EmptyHomePage()),
    );
  }

  final defaultLocation = navRoutes.isNotEmpty ? navRoutes.first.path : '/';

  final router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: isOnboardingComplete ? defaultLocation : '/onboarding',
    observers: [
      if (FirebaseInit.analytics != null)
        FirebaseAnalyticsObserver(analytics: FirebaseInit.analytics!),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: UnjynxErrorView(
        type: ErrorViewType.emptyData,
        icon: Icons.wrong_location_rounded,
        title: 'Page not found',
        subtitle: 'This route does not exist. Let us take you home.',
        actionLabel: 'Go Home',
        onRetry: () => GoRouter.of(context).go(defaultLocation),
      ),
    ),
    redirect: (context, state) {
      final path = state.uri.path;
      final goingToOnboarding = path.startsWith('/onboarding');
      final goingToLogin = path == '/login';
      final goingToForgotPassword = path == '/forgot-password';
      final goingToAuthFlow = goingToLogin || goingToForgotPassword;

      // Deep link path mapping: unjynx://tasks/{id} -> /todos/{id}
      // GoRouter receives the URI path directly from the deep link scheme.
      if (path.startsWith('/tasks/')) {
        final id = path.substring('/tasks/'.length);
        return '/todos/$id';
      }
      if (path == '/tasks') {
        return '/todos';
      }

      // Onboarding guard (first priority)
      if (!isOnboardingComplete && !goingToOnboarding) {
        return '/onboarding';
      }
      if (isOnboardingComplete && goingToOnboarding) {
        return defaultLocation;
      }

      // Auth guard (second priority)
      if (!isAuthenticated && !goingToAuthFlow && !goingToOnboarding) {
        return '/login?redirect=$path';
      }
      if (isAuthenticated && goingToLogin) {
        return defaultLocation;
      }

      // Org onboarding guard (third priority — after auth, before app)
      final goingToOrgOnboarding = path == '/org-onboarding';
      if (isAuthenticated &&
          isOrgOnboardingNeeded &&
          !goingToOrgOnboarding &&
          !goingToOnboarding) {
        return '/org-onboarding';
      }
      if (isAuthenticated && !isOrgOnboardingNeeded && goingToOrgOnboarding) {
        return defaultLocation;
      }

      return null;
    },
    routes: routes,
  );

  return router;
}

/// App shell with bottom navigation bar and global connection banner.
class _AppShell extends ConsumerWidget {
  const _AppShell({required this.pluginRoutes, required this.child});

  final List<PluginRoute> pluginRoutes;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connState = ref.watch(connectivityProvider);

    return Scaffold(
      body: Column(
        children: [
          // Global connectivity banner — sits above page content.
          UnjynxConnectionBanner(
            state: connState,
            onAutoDismiss: () {
              ref.read(connectivityProvider.notifier).recheck();
            },
          ),
          // Organization switcher — shows current org, tap to switch
          const OrgSwitcher(),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: pluginRoutes.length > 1
          ? NavigationBar(
              destinations: [
                for (final route in pluginRoutes)
                  NavigationDestination(
                    icon: Icon(route.icon),
                    label: route.label,
                  ),
              ],
              onDestinationSelected: (index) {
                GoRouter.of(context).go(pluginRoutes[index].path);
              },
              selectedIndex: _currentIndex(context),
            )
          : null,
    );
  }

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    // Exact match first, then prefix match (skip '/' to avoid false positives)
    var index = pluginRoutes.indexWhere((r) => r.path == location);
    if (index < 0) {
      index = pluginRoutes.indexWhere(
        (r) => r.path != '/' && location.startsWith(r.path),
      );
    }
    return index >= 0 ? index : 0;
  }
}

/// Placeholder when no plugins are loaded.
class _EmptyHomePage extends StatelessWidget {
  const _EmptyHomePage();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bolt, size: 64, color: colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'UNJYNX',
              style: Theme.of(
                context,
              ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Break the satisfactory.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
