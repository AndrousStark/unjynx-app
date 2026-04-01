/// UNJYNX Team - Team management, shared projects, standups, and reports.
library feature_team;

// Domain models
export 'src/domain/models/organization.dart';
export 'src/domain/models/standup_entry.dart';
export 'src/domain/models/team.dart';
export 'src/domain/models/team_invite.dart';
export 'src/domain/models/team_member.dart';
export 'src/domain/models/team_report.dart';

// Presentation
export 'src/presentation/pages/async_standup_page.dart';
export 'src/presentation/pages/org_reports_page.dart';
export 'src/presentation/pages/shared_project_page.dart';
export 'src/presentation/pages/team_dashboard_page.dart';
export 'src/presentation/pages/team_members_page.dart';
export 'src/presentation/pages/team_reports_page.dart';
export 'src/presentation/providers/team_providers.dart';

// Plugin
export 'src/team_plugin.dart';
