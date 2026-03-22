import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_auth/service_auth.dart';

import '../api_client.dart';
import '../api_config.dart';
import '../services/accountability_api_service.dart';
import '../services/admin_api_service.dart';
import '../services/auth_api_service.dart';
import '../services/billing_api_service.dart';
import '../services/calendar_api_service.dart';
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
import '../services/team_api_service.dart';

/// API config — override for production base URL.
final apiConfigProvider = Provider<ApiConfig>(
  (ref) => ApiConfig.development,
);

/// Central API client — depends on auth for token injection.
final apiClientProvider = Provider<ApiClient>((ref) {
  final auth = ref.watch(authPortProvider);
  final config = ref.watch(apiConfigProvider);
  return ApiClient(auth: auth, config: config);
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

// Phase 7: Industry Modes

final modeApiProvider = Provider<ModeApiService>(
  (ref) => ModeApiService(ref.watch(apiClientProvider)),
);
