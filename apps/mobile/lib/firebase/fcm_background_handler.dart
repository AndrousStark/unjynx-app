import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Top-level FCM background message handler.
///
/// **Must** be a top-level function (not a class method or closure)
/// because it runs in a separate isolate when the app is terminated
/// or backgrounded.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase must be re-initialized in the background isolate.
  await Firebase.initializeApp();

  debugPrint(
    'FCM background message: ${message.messageId} '
    'title=${message.notification?.title}',
  );
}
