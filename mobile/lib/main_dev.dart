/// Development entry point.
///
/// Usage:
///   flutter run -t lib/main_dev.dart \
///     --dart-define=ENV=development \
///     --dart-define=API_BASE_URL=http://10.0.2.2:3000 \
///     --dart-define=LOGTO_ENDPOINT=http://10.0.2.2:3001 \
///     --dart-define=LOGTO_APP_ID=unjynx-dev \
///     --dart-define=FEATURE_TEAM=true \
///     --dart-define=FEATURE_IMPORT_EXPORT=true \
///     --dart-define=FEATURE_WIDGETS=true
///
/// All incomplete features are enabled in dev for testing.
library;

import 'main.dart' as app;

void main() => app.main();
