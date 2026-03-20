import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:feature_home/feature_home.dart';

// ---------------------------------------------------------------------------
// Minimal stub AudioPlayer for unit tests.
//
// Tests only verify state management (selectSound, setVolume, play/pause/stop).
// Actual audio playback is tested via integration / E2E tests on a real device.
// ---------------------------------------------------------------------------

/// A lightweight fake that satisfies the AudioPlayer interface just enough
/// for the AmbientSoundController state-management tests. Because just_audio
/// requires native platform plugins, we override [ambientAudioPlayerProvider]
/// with this stub so the tests can run without a platform channel.
// ignore: avoid_implementing_value_types
class _StubAudioPlayer implements AudioPlayer {
  @override
  dynamic noSuchMethod(Invocation invocation) {
    // Return correctly typed futures for the methods the controller calls.
    final name = invocation.memberName;

    // setAudioSource returns Future<Duration?>
    if (name == #setAudioSource) {
      return Future<Duration?>.value(Duration.zero);
    }

    // setLoopMode, setVolume, pause, stop, dispose return Future<void>
    if (name == #setLoopMode ||
        name == #setVolume ||
        name == #pause ||
        name == #stop ||
        name == #dispose) {
      return Future<void>.value();
    }

    // play returns Future<void>
    if (name == #play) {
      return Future<void>.value();
    }

    return null;
  }
}

void main() {
  // Required for just_audio's LockCachingAudioSource which calls
  // getTemporaryDirectory() via path_provider.
  TestWidgetsFlutterBinding.ensureInitialized();

  // Provide a fake response for path_provider's getTemporaryDirectory.
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (MethodCall methodCall) async {
        if (methodCall.method == 'getTemporaryDirectory') {
          return '.';
        }
        return null;
      },
    );
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      null,
    );
  });

  group('AmbientSound enum', () {
    test('silence has no remote URL', () {
      expect(AmbientSound.silence.remoteUrl, isNull);
      expect(AmbientSound.silence.assetPath, isNull); // legacy alias
      expect(AmbientSound.silence.isSilence, isTrue);
    });

    test('rain has correct label', () {
      expect(AmbientSound.rain.label, 'Rain');
      expect(AmbientSound.rain.isSilence, isFalse);
    });

    test('all sounds have labels', () {
      for (final sound in AmbientSound.values) {
        expect(sound.label, isNotEmpty);
      }
    });

    test('non-silence sounds have remote URLs', () {
      for (final sound in AmbientSound.values) {
        if (!sound.isSilence) {
          expect(sound.remoteUrl, isNotNull);
          expect(sound.remoteUrl, startsWith('https://'));
        }
      }
    });

    test('remote URLs point to api.unjynx.me/static/sounds', () {
      for (final sound in AmbientSound.values) {
        if (!sound.isSilence) {
          expect(
            sound.remoteUrl,
            startsWith('https://api.unjynx.me/static/sounds/'),
          );
          expect(sound.remoteUrl, endsWith('.ogg'));
        }
      }
    });

    test('assetPath alias returns remoteUrl for compatibility', () {
      for (final sound in AmbientSound.values) {
        expect(sound.assetPath, equals(sound.remoteUrl));
      }
    });
  });

  group('AmbientSoundState', () {
    test('default state is silence and not playing', () {
      const state = AmbientSoundState();
      expect(state.sound, AmbientSound.silence);
      expect(state.volume, 0.5);
      expect(state.isPlaying, isFalse);
    });

    test('copyWith creates new instance with changed fields', () {
      const state = AmbientSoundState();
      final updated = state.copyWith(
        sound: AmbientSound.rain,
        volume: 0.8,
        isPlaying: true,
      );
      expect(updated.sound, AmbientSound.rain);
      expect(updated.volume, 0.8);
      expect(updated.isPlaying, isTrue);
      // Original unchanged
      expect(state.sound, AmbientSound.silence);
    });

    test('copyWith with no args returns equivalent state', () {
      const state = AmbientSoundState(
        sound: AmbientSound.cafe,
        volume: 0.3,
        isPlaying: true,
      );
      final copy = state.copyWith();
      expect(copy.sound, state.sound);
      expect(copy.volume, state.volume);
      expect(copy.isPlaying, state.isPlaying);
    });
  });

  group('AmbientSoundController', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer(
        overrides: [
          ambientAudioPlayerProvider.overrideWithValue(_StubAudioPlayer()),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('selectSound updates sound', () {
      final controller =
          container.read(ambientSoundControllerProvider.notifier);
      controller.selectSound(AmbientSound.forest);
      expect(
        container.read(ambientSoundControllerProvider).sound,
        AmbientSound.forest,
      );
    });

    test('setVolume clamps between 0 and 1', () {
      final controller =
          container.read(ambientSoundControllerProvider.notifier);
      controller.setVolume(1.5);
      expect(container.read(ambientSoundControllerProvider).volume, 1.0);
      controller.setVolume(-0.5);
      expect(container.read(ambientSoundControllerProvider).volume, 0.0);
    });

    test('play sets isPlaying for non-silence', () {
      final controller =
          container.read(ambientSoundControllerProvider.notifier);
      controller.selectSound(AmbientSound.rain);
      controller.play();
      expect(
        container.read(ambientSoundControllerProvider).isPlaying,
        isTrue,
      );
    });

    test('play does not set isPlaying for silence', () {
      final controller =
          container.read(ambientSoundControllerProvider.notifier);
      controller.play();
      expect(
        container.read(ambientSoundControllerProvider).isPlaying,
        isFalse,
      );
    });

    test('stop resets isPlaying', () {
      final controller =
          container.read(ambientSoundControllerProvider.notifier);
      controller.selectSound(AmbientSound.lofi);
      controller.play();
      expect(
        container.read(ambientSoundControllerProvider).isPlaying,
        isTrue,
      );
      controller.stop();
      expect(
        container.read(ambientSoundControllerProvider).isPlaying,
        isFalse,
      );
    });

    test('pause sets isPlaying to false', () {
      final controller =
          container.read(ambientSoundControllerProvider.notifier);
      controller.selectSound(AmbientSound.cafe);
      controller.play();
      controller.pause();
      expect(
        container.read(ambientSoundControllerProvider).isPlaying,
        isFalse,
      );
    });
  });
}
