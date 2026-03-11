import 'dart:io';

/// Result of a device integrity check.
///
/// Contains whether the device appears compromised and the specific
/// reasons detected. This is a basic v1 check — not a replacement for
/// Play Integrity API or App Attest, but sufficient for initial release.
class DeviceIntegrityResult {
  const DeviceIntegrityResult({
    required this.isCompromised,
    required this.reasons,
  });

  /// Whether the device appears rooted (Android) or jailbroken (iOS).
  final bool isCompromised;

  /// Human-readable reasons why the device was flagged.
  final List<String> reasons;

  @override
  String toString() =>
      'DeviceIntegrityResult(isCompromised: $isCompromised, '
      'reasons: $reasons)';
}

/// Lightweight root/jailbreak detection utility.
///
/// Checks common filesystem indicators that suggest a device has been
/// rooted (Android) or jailbroken (iOS). This is a heuristic approach
/// and can be bypassed by sophisticated tools — upgrade to Play
/// Integrity API / App Attest for production-grade attestation.
class DeviceIntegrity {
  DeviceIntegrity._();

  // ---------------------------------------------------------------------------
  // Android indicators
  // ---------------------------------------------------------------------------

  /// Common paths where the `su` binary is installed on rooted devices.
  static const List<String> _androidSuPaths = [
    '/system/app/Superuser.apk',
    '/system/bin/su',
    '/system/xbin/su',
    '/sbin/su',
    '/data/local/xbin/su',
    '/data/local/bin/su',
    '/data/local/su',
    '/su/bin/su',
    '/system/sd/xbin/su',
    '/system/bin/failsafe/su',
    '/system/usr/we-need-root/su',
  ];

  /// Package names of well-known root management apps.
  static const List<String> _androidRootAppPaths = [
    '/data/data/com.topjohnwu.magisk',
    '/data/data/eu.chainfire.supersu',
    '/data/data/com.koushikdutta.superuser',
    '/data/data/com.noshufou.android.su',
    '/data/data/com.thirdparty.superuser',
    '/data/data/com.yellowes.su',
    '/data/data/com.zachspong.temprootremovejb',
    '/data/data/com.ramdroid.appquarantine',
  ];

  /// Dangerous system properties that indicate a non-production build.
  static const List<String> _androidSuspiciousPaths = [
    '/system/app/Superuser.apk',
    '/system/etc/init.d',
    '/system/bin/.ext',
    '/system/xbin/daemonsu',
  ];

  // ---------------------------------------------------------------------------
  // iOS indicators
  // ---------------------------------------------------------------------------

  /// Filesystem paths that exist only on jailbroken iOS devices.
  static const List<String> _iosJailbreakPaths = [
    '/Applications/Cydia.app',
    '/Applications/Sileo.app',
    '/Applications/Zebra.app',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',
    '/bin/bash',
    '/usr/sbin/sshd',
    '/etc/apt',
    '/usr/bin/ssh',
    '/private/var/lib/apt',
    '/private/var/lib/apt/',
    '/private/var/lib/cydia',
    '/private/var/stash',
    '/private/var/mobile/Library/SBSettings/Themes',
    '/var/cache/apt',
    '/var/lib/apt',
    '/var/lib/cydia',
    '/usr/libexec/cydia',
    '/usr/bin/cycript',
    '/usr/local/bin/cycript',
    '/usr/lib/libcycript.dylib',
    '/var/log/syslog',
  ];

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Runs all integrity checks for the current platform.
  ///
  /// Returns a [DeviceIntegrityResult] containing the verdict and the
  /// list of reasons that triggered it. Safe to call on any platform —
  /// returns a clean result on unsupported platforms (desktop, web stub).
  static DeviceIntegrityResult checkIntegrity() {
    if (Platform.isAndroid) {
      return _checkAndroid();
    }
    if (Platform.isIOS) {
      return _checkIOS();
    }
    // Desktop / unsupported — no checks applicable.
    return const DeviceIntegrityResult(isCompromised: false, reasons: []);
  }

  // ---------------------------------------------------------------------------
  // Android checks
  // ---------------------------------------------------------------------------

  static DeviceIntegrityResult _checkAndroid() {
    final reasons = <String>[];

    // 1. Check for su binary in common locations.
    for (final path in _androidSuPaths) {
      if (_fileExists(path)) {
        reasons.add('su binary found at $path');
      }
    }

    // 2. Check for known root management app data directories.
    for (final path in _androidRootAppPaths) {
      if (_directoryExists(path)) {
        reasons.add('Root app data found at $path');
      }
    }

    // 3. Check for suspicious system paths.
    for (final path in _androidSuspiciousPaths) {
      if (_fileExists(path) || _directoryExists(path)) {
        reasons.add('Suspicious system path found: $path');
      }
    }

    // 4. Check build tags for test-keys (indicates non-release firmware).
    try {
      final buildTags =
          Platform.environment['ANDROID_BUILD_TAGS'] ?? '';
      if (buildTags.contains('test-keys')) {
        reasons.add('Build tags contain "test-keys"');
      }
    } on Exception {
      // Swallow — environment variable may not be available.
    }

    return DeviceIntegrityResult(
      isCompromised: reasons.isNotEmpty,
      reasons: List.unmodifiable(reasons),
    );
  }

  // ---------------------------------------------------------------------------
  // iOS checks
  // ---------------------------------------------------------------------------

  static DeviceIntegrityResult _checkIOS() {
    final reasons = <String>[];

    // 1. Check for jailbreak-specific filesystem paths.
    for (final path in _iosJailbreakPaths) {
      if (_fileExists(path) || _directoryExists(path)) {
        reasons.add('Jailbreak indicator found at $path');
      }
    }

    // 2. Try to write outside the sandbox (jailbroken devices allow this).
    try {
      final testFile = File('/private/jailbreak_test_${DateTime.now().millisecondsSinceEpoch}');
      testFile.writeAsStringSync('test');
      // If we got here, the device is jailbroken — clean up.
      testFile.deleteSync();
      reasons.add('Able to write outside app sandbox');
    } on FileSystemException {
      // Expected on non-jailbroken devices — writing outside sandbox fails.
    }

    return DeviceIntegrityResult(
      isCompromised: reasons.isNotEmpty,
      reasons: List.unmodifiable(reasons),
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  static bool _fileExists(String path) {
    try {
      return File(path).existsSync();
    } on Exception {
      return false;
    }
  }

  static bool _directoryExists(String path) {
    try {
      return Directory(path).existsSync();
    } on Exception {
      return false;
    }
  }
}
