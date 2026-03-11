/// Ambient sound service for Pomodoro focus sessions.
///
/// Uses a port-based abstraction so the actual audio implementation
/// can be swapped (just_audio for real, mock for tests).
/// For Phase 2, this is a stub that tracks state without actual playback.
/// Phase 3+ will wire just_audio when the package is added.

enum AmbientSound {
  silence('Silence', null),
  rain('Rain', 'assets/sounds/rain.mp3'),
  forest('Forest', 'assets/sounds/forest.mp3'),
  cafe('Cafe', 'assets/sounds/cafe.mp3'),
  lofi('Lo-Fi', 'assets/sounds/lofi.mp3'),
  whiteNoise('White Noise', 'assets/sounds/white_noise.mp3');

  const AmbientSound(this.label, this.assetPath);

  final String label;
  final String? assetPath;

  bool get isSilence => this == AmbientSound.silence;
}

/// State for the ambient sound player.
class AmbientSoundState {
  final AmbientSound sound;
  final double volume;
  final bool isPlaying;

  const AmbientSoundState({
    this.sound = AmbientSound.silence,
    this.volume = 0.5,
    this.isPlaying = false,
  });

  AmbientSoundState copyWith({
    AmbientSound? sound,
    double? volume,
    bool? isPlaying,
  }) {
    return AmbientSoundState(
      sound: sound ?? this.sound,
      volume: volume ?? this.volume,
      isPlaying: isPlaying ?? this.isPlaying,
    );
  }
}
