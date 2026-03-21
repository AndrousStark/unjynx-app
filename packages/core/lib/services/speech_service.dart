import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';

/// Thin wrapper around [SpeechToText] that provides a simplified API
/// for voice input across the app.
///
/// Usage:
/// ```dart
/// final stt = SpeechService();
/// final available = await stt.initialize();
/// if (available) {
///   await stt.startListening(onResult: (text) => print(text));
/// }
/// ```
class SpeechService {
  /// Creates a new [SpeechService] instance.
  ///
  /// Accepts an optional [stt] parameter for testing with a mock.
  SpeechService({SpeechToText? stt}) : _stt = stt ?? SpeechToText();

  final SpeechToText _stt;
  bool _isAvailable = false;

  /// Initialize the speech recognition engine.
  ///
  /// Returns `true` if speech recognition is available on this device.
  /// Must be called before [startListening].
  Future<bool> initialize() async {
    _isAvailable = await _stt.initialize(
      onError: (error) => debugPrint('SpeechService error: ${error.errorMsg}'),
      onStatus: (status) => debugPrint('SpeechService status: $status'),
    );
    return _isAvailable;
  }

  /// Begin listening for speech input.
  ///
  /// [onResult] is called with the recognized text each time the engine
  /// produces a result (both partial and final).
  ///
  /// [listenFor] controls the maximum listen duration (default 10s).
  /// [pauseFor] controls how long silence triggers a stop (default 3s).
  Future<void> startListening({
    required ValueChanged<String> onResult,
    Duration listenFor = const Duration(seconds: 10),
    Duration pauseFor = const Duration(seconds: 3),
  }) async {
    if (!_isAvailable) return;
    await _stt.listen(
      onResult: (result) => onResult(result.recognizedWords),
      listenFor: listenFor,
      pauseFor: pauseFor,
    );
  }

  /// Stop the current listening session.
  Future<void> stopListening() async => _stt.stop();

  /// Cancel the current listening session without waiting for final results.
  Future<void> cancel() async => _stt.cancel();

  /// Whether the engine is currently listening for speech.
  bool get isListening => _stt.isListening;

  /// Whether speech recognition is available on this device.
  ///
  /// Only valid after [initialize] has been called.
  bool get isAvailable => _isAvailable;

  /// Clean up resources. Call when the service is no longer needed.
  void dispose() {
    if (_stt.isListening) {
      _stt.stop();
    }
  }
}
