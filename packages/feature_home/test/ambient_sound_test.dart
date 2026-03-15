import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:feature_home/feature_home.dart';

void main() {
  group('AmbientSound enum', () {
    test('silence has no asset path', () {
      expect(AmbientSound.silence.assetPath, isNull);
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

    test('non-silence sounds have asset paths', () {
      for (final sound in AmbientSound.values) {
        if (!sound.isSilence) {
          expect(sound.assetPath, isNotNull);
        }
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
      container = ProviderContainer();
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
