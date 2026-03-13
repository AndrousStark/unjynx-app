/// Staging entry point.
///
/// Usage:
///   flutter run -t lib/main_staging.dart \
///     --dart-define=ENV=staging \
///     --dart-define=API_BASE_URL=https://staging.api.unjynx.me \
///     --dart-define=LOGTO_ENDPOINT=https://staging.auth.unjynx.me \
///     --dart-define=LOGTO_APP_ID=unjynx-staging \
///     --dart-define=SENTRY_DSN=<staging-dsn>
library;

import 'main.dart' as app;

void main() => app.main();
