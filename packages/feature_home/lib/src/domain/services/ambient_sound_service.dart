// Ambient sound service for Pomodoro focus sessions.
//
// Sounds are streamed from the UNJYNX backend and cached on-device
// using just_audio's LockCachingAudioSource. No bundled assets needed.

/// Base URL for remotely hosted ambient sound files.
const String _soundBaseUrl = 'https://api.unjynx.me/static/sounds';

/// Available ambient sounds for Pomodoro focus sessions.
enum AmbientSound {
  /// No sound -- silence.
  silence('Silence', null),

  /// Rainfall ambiance.
  rain('Rain', '$_soundBaseUrl/rain.ogg'),

  /// Forest / nature ambiance.
  forest('Forest', '$_soundBaseUrl/forest.ogg'),

  /// Coffee shop ambiance.
  cafe('Cafe', '$_soundBaseUrl/cafe.ogg'),

  /// Lo-Fi beats ambiance.
  lofi('Lo-Fi', '$_soundBaseUrl/lofi.ogg'),

  /// White noise ambiance.
  whiteNoise('White Noise', '$_soundBaseUrl/white_noise.ogg');

  const AmbientSound(this.label, this.remoteUrl);

  /// Human-readable display name.
  final String label;

  /// Remote URL for streaming + caching. Null for [silence].
  final String? remoteUrl;

  /// Whether this is the "no sound" option.
  bool get isSilence => this == AmbientSound.silence;

  /// Legacy alias kept for backward compatibility with tests.
  /// Returns [remoteUrl] (was previously named `assetPath`).
  String? get assetPath => remoteUrl;
}

/// State for the ambient sound player.
class AmbientSoundState {
  /// Creates an ambient sound state.
  const AmbientSoundState({
    this.sound = AmbientSound.silence,
    this.volume = 0.5,
    this.isPlaying = false,
  });

  /// The currently selected sound.
  final AmbientSound sound;

  /// Playback volume (0.0 to 1.0).
  final double volume;

  /// Whether the sound is currently playing.
  final bool isPlaying;

  /// Returns a copy with the given fields replaced.
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
