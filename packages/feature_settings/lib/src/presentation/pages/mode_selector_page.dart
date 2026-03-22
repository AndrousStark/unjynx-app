import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

/// Industry mode data model parsed from API response.
class _ModeData {
  final String slug;
  final String name;
  final String description;
  final IconData icon;
  final Color accentColor;
  final Map<String, String> vocabulary;

  const _ModeData({
    required this.slug,
    required this.name,
    required this.description,
    required this.icon,
    required this.accentColor,
    required this.vocabulary,
  });
}

/// Maps a slug to a display icon.
IconData _iconForSlug(String slug) {
  return switch (slug) {
    'general' => Icons.tune_rounded,
    'hustle' => Icons.rocket_launch_rounded,
    'closer' => Icons.handshake_rounded,
    'grind' => Icons.fitness_center_rounded,
    _ => Icons.settings_suggest_rounded,
  };
}

/// Maps a slug to a brand accent color.
Color _accentForSlug(String slug) {
  return switch (slug) {
    'general' => const Color(0xFF6750A4), // Primary purple
    'hustle' => const Color(0xFFFF6B35), // Energetic orange
    'closer' => const Color(0xFF00C853), // Deal green
    'grind' => const Color(0xFFE53935), // Intense red
    _ => const Color(0xFF6750A4),
  };
}

/// O1 - Full-screen Industry Mode selector page.
///
/// Displays 4 mode cards (General, Hustle, Closer, Grind), each with icon,
/// name, description, accent color, and "Active" badge. Tapping a card
/// sets the mode via API and updates the vocabulary provider.
class ModeSelectorPage extends ConsumerStatefulWidget {
  const ModeSelectorPage({super.key});

  @override
  ConsumerState<ModeSelectorPage> createState() => _ModeSelectorPageState();
}

class _ModeSelectorPageState extends ConsumerState<ModeSelectorPage> {
  List<_ModeData> _modes = const [];
  String _activeSlug = 'general';
  String? _previewSlug;
  bool _isLoading = true;
  bool _isSwitching = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadModes();
  }

  Future<void> _loadModes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final modeApi = ref.read(modeApiProvider);

      // Fetch all modes and active mode in parallel.
      final results = await Future.wait([
        modeApi.getModes(),
        modeApi.getActiveMode(),
      ]);

      final modesResponse = results[0] as ApiResponse<List<dynamic>>;
      final activeResponse =
          results[1] as ApiResponse<Map<String, dynamic>>;

      if (modesResponse.success && modesResponse.data != null) {
        final parsed = <_ModeData>[];
        for (final raw in modesResponse.data!) {
          if (raw is Map<String, dynamic>) {
            final slug = (raw['slug'] as String?) ?? 'general';
            final vocabRaw = raw['vocabulary'];
            final vocab = <String, String>{};
            if (vocabRaw is Map) {
              for (final entry in vocabRaw.entries) {
                vocab[entry.key.toString()] = entry.value.toString();
              }
            }

            parsed.add(_ModeData(
              slug: slug,
              name: (raw['name'] as String?) ?? slug,
              description: (raw['description'] as String?) ?? '',
              icon: _iconForSlug(slug),
              accentColor: _accentForSlug(slug),
              vocabulary: Map.unmodifiable(vocab),
            ));
          }
        }
        _modes = List.unmodifiable(parsed);
      }

      if (activeResponse.success && activeResponse.data != null) {
        _activeSlug =
            (activeResponse.data!['slug'] as String?) ?? 'general';
      }
    } on DioException catch (e) {
      _error = 'Failed to load modes: ${e.message}';
      // Fall back to hardcoded modes for offline usage.
      _modes = _fallbackModes();
      _activeSlug = await _loadCachedSlug();
    } on ApiException catch (e) {
      _error = 'Failed to load modes: ${e.message}';
      _modes = _fallbackModes();
      _activeSlug = await _loadCachedSlug();
    } catch (e) {
      _error = 'Failed to load modes: $e';
      _modes = _fallbackModes();
      _activeSlug = await _loadCachedSlug();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<_ModeData> _fallbackModes() {
    return const [
      _ModeData(
        slug: 'general',
        name: 'General',
        description: 'Standard productivity mode with no vocabulary changes.',
        icon: Icons.tune_rounded,
        accentColor: Color(0xFF6750A4),
        vocabulary: {},
      ),
      _ModeData(
        slug: 'hustle',
        name: 'Hustle',
        description:
            'For entrepreneurs and go-getters. Tasks become Deliverables, '
            'Projects become Clients.',
        icon: Icons.rocket_launch_rounded,
        accentColor: Color(0xFFFF6B35),
        vocabulary: {
          'Task': 'Deliverable',
          'Tasks': 'Deliverables',
          'Project': 'Client',
          'Projects': 'Clients',
          'Deadline': 'Drop-Dead Date',
          'Pomodoro': 'Sprint',
          'Ghost Mode': 'Stealth Mode',
        },
      ),
      _ModeData(
        slug: 'closer',
        name: 'Closer',
        description:
            'For sales professionals. Tasks become Actions, '
            'Projects become Deals.',
        icon: Icons.handshake_rounded,
        accentColor: Color(0xFF00C853),
        vocabulary: {
          'Task': 'Action',
          'Tasks': 'Actions',
          'Project': 'Deal',
          'Projects': 'Deals',
          'Deadline': 'Close Date',
          'Pomodoro': 'Power Hour',
          'Ghost Mode': 'Do Not Disturb',
        },
      ),
      _ModeData(
        slug: 'grind',
        name: 'Grind',
        description:
            'For athletes and fitness-minded. Tasks become Reps, '
            'Projects become Programs.',
        icon: Icons.fitness_center_rounded,
        accentColor: Color(0xFFE53935),
        vocabulary: {
          'Task': 'Rep',
          'Tasks': 'Reps',
          'Project': 'Program',
          'Projects': 'Programs',
          'Deadline': 'Game Day',
          'Pomodoro': 'Set',
          'Ghost Mode': 'Beast Mode',
        },
      ),
    ];
  }

  Future<String> _loadCachedSlug() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('unjynx_active_mode_slug') ?? 'general';
    } catch (_) {
      return 'general';
    }
  }

  Future<void> _switchMode(String slug) async {
    if (slug == _activeSlug || _isSwitching) return;

    HapticFeedback.mediumImpact();
    setState(() => _isSwitching = true);

    try {
      final modeApi = ref.read(modeApiProvider);
      final response = await modeApi.setActiveMode(slug);

      if (response.success) {
        // Update the vocabulary provider with the new mode's vocabulary.
        final selectedMode = _modes.firstWhere(
          (m) => m.slug == slug,
          orElse: () => _modes.first,
        );

        ref.read(vocabularyProvider.notifier).state =
            Map<String, String>.from(selectedMode.vocabulary);

        // Cache to SharedPreferences for offline access.
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('unjynx_active_mode_slug', slug);

          // Cache vocabulary as well.
          final vocabEntries = selectedMode.vocabulary.entries
              .map((e) => '${e.key}=${e.value}')
              .join('|');
          await prefs.setString('unjynx_active_mode_vocab', vocabEntries);
        } catch (_) {
          // Non-critical: cache failure is okay.
        }

        setState(() {
          _activeSlug = slug;
          _previewSlug = null;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Switched to ${selectedMode.name} mode',
              ),
              backgroundColor: context.unjynx.success,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      } else {
        _showError(response.error ?? 'Failed to switch mode');
      }
    } on DioException catch (e) {
      _showError('Network error: ${e.message}');
    } on ApiException catch (e) {
      _showError('API error: ${e.message}');
    } catch (e) {
      _showError('Failed to switch mode: $e');
    } finally {
      if (mounted) {
        setState(() => _isSwitching = false);
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Industry Mode'),
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const UnjynxShimmerCard(),
                  const SizedBox(height: 12),
                  const UnjynxShimmerCard(),
                  const SizedBox(height: 12),
                  const UnjynxShimmerCard(),
                  const SizedBox(height: 12),
                  const UnjynxShimmerCard(),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  Text(
                    'Choose how UNJYNX speaks to you. Each mode rewrites '
                    'labels across the entire app.',
                    style: TextStyle(
                      fontSize: 14,
                      color: colorScheme.onSurfaceVariant,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Error banner
                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colorScheme.error.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: colorScheme.error.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.cloud_off_rounded,
                            size: 18,
                            color: colorScheme.error,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Offline mode. Showing cached data.',
                              style: TextStyle(
                                fontSize: 13,
                                color: colorScheme.error,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _loadModes,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Mode cards
                  for (var i = 0; i < _modes.length; i++) ...[
                    if (i > 0) const SizedBox(height: 12),
                    _ModeCard(
                      mode: _modes[i],
                      isActive: _modes[i].slug == _activeSlug,
                      isPreview: _modes[i].slug == _previewSlug,
                      isSwitching: _isSwitching,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          _previewSlug = _modes[i].slug == _previewSlug
                              ? null
                              : _modes[i].slug;
                        });
                      },
                      onActivate: () => _switchMode(_modes[i].slug),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}

// ---------------------------------------------------------------------------
// Mode card
// ---------------------------------------------------------------------------

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.mode,
    required this.isActive,
    required this.isPreview,
    required this.isSwitching,
    required this.onTap,
    required this.onActivate,
  });

  final _ModeData mode;
  final bool isActive;
  final bool isPreview;
  final bool isSwitching;
  final VoidCallback onTap;
  final VoidCallback onActivate;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return PressableScale(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: isActive
              ? mode.accentColor.withValues(alpha: isLight ? 0.08 : 0.12)
              : isLight
                  ? colorScheme.surfaceContainerLowest
                  : colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive
                ? mode.accentColor.withValues(alpha: isLight ? 0.4 : 0.5)
                : isPreview
                    ? mode.accentColor.withValues(
                        alpha: isLight ? 0.25 : 0.3,
                      )
                    : isLight
                        ? colorScheme.primary.withValues(alpha: 0.08)
                        : Colors.transparent,
            width: isActive ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isActive
                  ? mode.accentColor.withValues(alpha: isLight ? 0.12 : 0.2)
                  : const Color(0xFF1A0533).withValues(
                      alpha: isLight ? 0.06 : 0.3,
                    ),
              blurRadius: isActive ? 16 : 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: icon + name + badge
              Row(
                children: [
                  // Icon circle
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: mode.accentColor.withValues(
                        alpha: isLight ? 0.12 : 0.18,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      mode.icon,
                      color: mode.accentColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Name
                  Expanded(
                    child: Text(
                      mode.name,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.onSurface,
                      ),
                    ),
                  ),

                  // Active badge
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: mode.accentColor.withValues(
                          alpha: isLight ? 0.15 : 0.2,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: mode.accentColor.withValues(
                            alpha: isLight ? 0.3 : 0.4,
                          ),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.check_circle_rounded,
                            size: 14,
                            color: mode.accentColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Active',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: mode.accentColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 10),

              // Description
              Text(
                mode.description,
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                  height: 1.4,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              // Vocabulary preview (expanded when tapped)
              if (isPreview && mode.vocabulary.isNotEmpty) ...[
                const SizedBox(height: 14),
                _VocabularyPreview(
                  vocabulary: mode.vocabulary,
                  accentColor: mode.accentColor,
                ),
              ],

              // Activate button (shown when previewing a non-active mode)
              if (isPreview && !isActive) ...[
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isSwitching ? null : onActivate,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: mode.accentColor,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor:
                          mode.accentColor.withValues(alpha: 0.4),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: isSwitching
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'Activate ${mode.name} Mode',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Vocabulary preview (3-4 example label swaps)
// ---------------------------------------------------------------------------

class _VocabularyPreview extends StatelessWidget {
  const _VocabularyPreview({
    required this.vocabulary,
    required this.accentColor,
  });

  final Map<String, String> vocabulary;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    // Show at most 4 vocabulary swaps.
    final entries = vocabulary.entries.take(4).toList();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: isLight ? 0.04 : 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: accentColor.withValues(alpha: isLight ? 0.12 : 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Label Preview',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: accentColor,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          for (var i = 0; i < entries.length; i++) ...[
            if (i > 0) const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  entries[i].key,
                  style: TextStyle(
                    fontSize: 13,
                    color: colorScheme.onSurfaceVariant,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(
                    Icons.arrow_forward_rounded,
                    size: 14,
                    color: accentColor.withValues(alpha: 0.6),
                  ),
                ),
                Text(
                  entries[i].value,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: accentColor,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
