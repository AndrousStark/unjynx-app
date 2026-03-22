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
  whiteNoise('White Noise', '$_soundBaseUrl/white_noise.ogg'),

  /// Crackling fireplace.
  fireplace('Fireplace', '$_soundBaseUrl/fireplace.ogg'),

  /// Ocean waves.
  ocean('Ocean Waves', '$_soundBaseUrl/ocean.ogg'),

  /// Birdsong forest ambiance.
  birds('Birds', '$_soundBaseUrl/birds.ogg'),

  /// Distant thunder storm.
  thunder('Thunder', '$_soundBaseUrl/thunder.ogg'),

  /// Train rhythm ambiance.
  train('Train', '$_soundBaseUrl/train.ogg'),

  /// Very quiet library ambiance.
  library('Library', '$_soundBaseUrl/library.ogg'),

  /// Wind through trees.
  wind('Wind', '$_soundBaseUrl/wind.ogg'),

  /// Campfire crackling.
  campfire('Campfire', '$_soundBaseUrl/campfire.ogg'),

  /// Rushing waterfall.
  waterfall('Waterfall', '$_soundBaseUrl/waterfall.ogg'),

  /// Night crickets chirping.
  crickets('Crickets', '$_soundBaseUrl/crickets.ogg'),

  /// Keyboard typing sounds.
  typing('Typing', '$_soundBaseUrl/typing.ogg'),

  /// City rain with distant traffic.
  cityRain('City Rain', '$_soundBaseUrl/city_rain.ogg'),

  /// Warm jazz cafe ambiance.
  jazz('Jazz Cafe', '$_soundBaseUrl/jazz.ogg'),

  /// Deep space ambient drone.
  space('Space', '$_soundBaseUrl/space.ogg'),

  /// Morning birds with light breeze.
  morning('Morning', '$_soundBaseUrl/morning.ogg');

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
