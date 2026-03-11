/// UNJYNX Core - Shared contracts, models, events, plugin system, and theme.
library unjynx_core;

// Contracts (Ports)
export 'contracts/database_port.dart';
export 'contracts/auth_port.dart';
export 'contracts/notification_port.dart';
export 'contracts/ai_port.dart';
export 'contracts/storage_port.dart';
export 'contracts/sync_port.dart';
export 'contracts/user_preferences_port.dart';

// Events
export 'events/event_bus.dart';
export 'events/app_events.dart';

// Plugin System
export 'plugin/unjynx_plugin.dart';
export 'plugin/plugin_registry.dart';

// Models
export 'models/project.dart';
export 'models/user_profile.dart';

// Theme
export 'theme/unjynx_colors.dart';
export 'theme/unjynx_extensions.dart';
export 'theme/unjynx_glass.dart';
export 'theme/unjynx_shadows.dart';
export 'theme/unjynx_theme.dart';
export 'theme/unjynx_typography.dart';

// Security
export 'src/security/device_integrity.dart';

// Utils
export 'utils/color_utils.dart';
export 'utils/priority_utils.dart';
export 'utils/result.dart';

// Widgets
export 'widgets/widgets.dart';
