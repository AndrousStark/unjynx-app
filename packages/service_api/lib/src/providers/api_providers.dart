import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_auth/service_auth.dart';

import '../api_client.dart';
import '../api_config.dart';
import '../services/accountability_api_service.dart';
import '../services/ai_api_service.dart';
import '../services/admin_api_service.dart';
import '../services/auth_api_service.dart';
import '../services/billing_api_service.dart';
import '../services/calendar_api_service.dart';
import '../services/comment_api_service.dart';
import '../services/channel_api_service.dart';
import '../services/content_api_service.dart';
import '../services/gamification_api_service.dart';
import '../services/import_export_api_service.dart';
import '../services/notification_api_service.dart';
import '../services/progress_api_service.dart';
import '../services/project_api_service.dart';
import '../services/sync_api_service.dart';
import '../services/task_api_service.dart';
import '../services/mode_api_service.dart';
import '../services/goal_api_service.dart';
import '../services/messaging_api_service.dart';
import '../services/organization_api_service.dart';
import '../services/pomodoro_api_service.dart';
import '../services/recurring_api_service.dart';
import '../services/report_api_service.dart';
import '../services/section_api_service.dart';
import '../services/sprint_api_service.dart';
import '../services/subtask_api_service.dart';
import '../services/tag_api_service.dart';
import '../services/team_api_service.dart';
import '../services/template_api_service.dart';
import '../services/custom_field_api_service.dart';
import '../services/workflow_api_service.dart';
import '../services/ai_team_api_service.dart';

/// API config — override for production base URL.
final apiConfigProvider = Provider<ApiConfig>((ref) => ApiConfig.development);

/// Central API client — depends on auth for token injection + org context.
final apiClientProvider = Provider<ApiClient>((ref) {
  final auth = ref.watch(authPortProvider);
  final config = ref.watch(apiConfigProvider);
  final client = ApiClient(
    auth: auth,
    config: config,
    orgIdProvider: () => auth.selectedOrgId,
  );
  return client;
});

/// Domain-specific API services.

final authApiProvider = Provider<AuthApiService>(
  (ref) => AuthApiService(ref.watch(apiClientProvider)),
);

final taskApiProvider = Provider<TaskApiService>(
  (ref) => TaskApiService(ref.watch(apiClientProvider)),
);

final projectApiProvider = Provider<ProjectApiService>(
  (ref) => ProjectApiService(ref.watch(apiClientProvider)),
);

final contentApiProvider = Provider<ContentApiService>(
  (ref) => ContentApiService(ref.watch(apiClientProvider)),
);

final progressApiProvider = Provider<ProgressApiService>(
  (ref) => ProgressApiService(ref.watch(apiClientProvider)),
);

final syncApiProvider = Provider<SyncApiService>(
  (ref) => SyncApiService(ref.watch(apiClientProvider)),
);

final notificationApiProvider = Provider<NotificationApiService>(
  (ref) => NotificationApiService(ref.watch(apiClientProvider)),
);

final channelApiProvider = Provider<ChannelApiService>(
  (ref) => ChannelApiService(ref.watch(apiClientProvider)),
);

// Phase 4 API services

final gamificationApiProvider = Provider<GamificationApiService>(
  (ref) => GamificationApiService(ref.watch(apiClientProvider)),
);

final accountabilityApiProvider = Provider<AccountabilityApiService>(
  (ref) => AccountabilityApiService(ref.watch(apiClientProvider)),
);

final billingApiProvider = Provider<BillingApiService>(
  (ref) => BillingApiService(ref.watch(apiClientProvider)),
);

final teamApiProvider = Provider<TeamApiService>(
  (ref) => TeamApiService(ref.watch(apiClientProvider)),
);

final importExportApiProvider = Provider<ImportExportApiService>(
  (ref) => ImportExportApiService(ref.watch(apiClientProvider)),
);

final adminApiProvider = Provider<AdminApiService>(
  (ref) => AdminApiService(ref.watch(apiClientProvider)),
);

final calendarApiProvider = Provider<CalendarApiService>(
  (ref) => CalendarApiService(ref.watch(apiClientProvider)),
);

final commentApiProvider = Provider<CommentApiService>(
  (ref) => CommentApiService(ref.watch(apiClientProvider)),
);

// Phase 6: AI (Claude + ML service)

final aiApiProvider = Provider<AiApiService>(
  (ref) => AiApiService(ref.watch(apiClientProvider)),
);

// Phase 7: Industry Modes

final modeApiProvider = Provider<ModeApiService>(
  (ref) => ModeApiService(ref.watch(apiClientProvider)),
);

// Phase 6: Pomodoro

final pomodoroApiProvider = Provider<PomodoroApiService>(
  (ref) => PomodoroApiService(ref.watch(apiClientProvider)),
);

// Phase 7: Sprints, Goals, Reports

final sprintApiProvider = Provider<SprintApiService>(
  (ref) => SprintApiService(ref.watch(apiClientProvider)),
);

final goalApiProvider = Provider<GoalApiService>(
  (ref) => GoalApiService(ref.watch(apiClientProvider)),
);

final reportApiProvider = Provider<ReportApiService>(
  (ref) => ReportApiService(ref.watch(apiClientProvider)),
);

// Phase 9: Messaging

final messagingApiProvider = Provider<MessagingApiService>(
  (ref) => MessagingApiService(ref.watch(apiClientProvider)),
);

// Sprint 2: Core task features (subtasks, tags, recurring, sections, templates)

final subtaskApiProvider = Provider<SubtaskApiService>(
  (ref) => SubtaskApiService(ref.watch(apiClientProvider)),
);

final tagApiProvider = Provider<TagApiService>(
  (ref) => TagApiService(ref.watch(apiClientProvider)),
);

final recurringApiProvider = Provider<RecurringApiService>(
  (ref) => RecurringApiService(ref.watch(apiClientProvider)),
);

final sectionApiProvider = Provider<SectionApiService>(
  (ref) => SectionApiService(ref.watch(apiClientProvider)),
);

final templateApiProvider = Provider<TemplateApiService>(
  (ref) => TemplateApiService(ref.watch(apiClientProvider)),
);

// Sprint 3: Advanced features (custom fields, workflows, AI team)

final customFieldApiProvider = Provider<CustomFieldApiService>(
  (ref) => CustomFieldApiService(ref.watch(apiClientProvider)),
);

final workflowApiProvider = Provider<WorkflowApiService>(
  (ref) => WorkflowApiService(ref.watch(apiClientProvider)),
);

final aiTeamApiProvider = Provider<AiTeamApiService>(
  (ref) => AiTeamApiService(ref.watch(apiClientProvider)),
);

// v2: Organizations (multi-tenant)

final organizationApiProvider = Provider<OrganizationApiService>(
  (ref) => OrganizationApiService(ref.watch(apiClientProvider)),
);
