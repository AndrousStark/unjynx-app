import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Quote card displaying daily inspirational content with save/share actions.
///
/// Tapping the card navigates to the full content feed at `/content`.
///
/// Layout:
/// ```text
/// [Category badge]
///
/// "[Content text]"
///
/// -- Author, Source              [heart] [share]
/// ```
class DailyContentCard extends ConsumerWidget {
  const DailyContentCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contentAsync = ref.watch(homeDailyContentProvider);

    return contentAsync.when(
      data: (content) => content != null
          ? PressableScale(
              onTap: () => context.push('/content'),
              child: _ContentCard(content: content),
            )
          : const SizedBox.shrink(),
      loading: () => const UnjynxShimmerBox(height: 200, borderRadius: 16),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

// ---------------------------------------------------------------------------
// Content card
// ---------------------------------------------------------------------------

class _ContentCard extends ConsumerStatefulWidget {
  const _ContentCard({required this.content});

  final DailyContent content;

  @override
  ConsumerState<_ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends ConsumerState<_ContentCard> {
  late bool _isSaved;

  @override
  void initState() {
    super.initState();
    _isSaved = widget.content.isSaved;
  }

  @override
  void didUpdateWidget(covariant _ContentCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.content.id != widget.content.id) {
      _isSaved = widget.content.isSaved;
    }
  }

  void _toggleSave() {
    HapticFeedback.lightImpact();
    final newSavedState = !_isSaved;
    setState(() {
      _isSaved = newSavedState;
    });
    final saveCallback = ref.read(contentSaveCallbackProvider);
    saveCallback(widget.content.id, saved: newSavedState).catchError((_) {
      // Revert optimistic update on failure.
      if (mounted) {
        setState(() {
          _isSaved = !newSavedState;
        });
      }
    });
  }

  Future<void> _share() async {
    HapticFeedback.lightImpact();
    final content = widget.content;
    final text = '\u201C${content.content}\u201D\n\n'
        '\u2014 ${content.author}'
        '${content.source != null ? ', ${content.source}' : ''}\n\n'
        'Shared via UNJYNX';

    // Copy to clipboard and show confirmation snackbar.
    // Note: share_plus integration deferred until added as a dependency.
    await Clipboard.setData(ClipboardData(text: text));
    if (mounted) {
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
              SizedBox(width: 8),
              Text('Quote copied — paste anywhere to share'),
            ],
          ),
          duration: const Duration(seconds: 2),
          backgroundColor: colorScheme.surfaceContainerHigh,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final content = widget.content;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        // Light: white with gold wash, Dark: surface with subtle gold glow
        color: isLight ? Colors.white : colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLight
              ? colorScheme.primary.withValues(alpha: 0.15)
              : colorScheme.primary.withValues(alpha: 0.25),
          width: isLight ? 1 : 0.5,
        ),
        boxShadow: context.unjynxShadow(UnjynxElevation.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- Category badge ---
          _CategoryBadge(category: content.category),

          const SizedBox(height: 16),

          // --- Quote text (Playfair Display) ---
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              '\u201C${content.content}\u201D',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'Playfair Display',
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w500,
                fontSize: 18,
                height: 1.44,
                color: colorScheme.onSurface,
              ),
            ),
          ),

          const SizedBox(height: 16),

          // --- Bottom: attribution + actions ---
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Attribution
              Expanded(
                child: Text(
                  '\u2014 ${content.author}'
                  '${content.source != null ? ', ${content.source}' : ''}',
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),

              // Save button
              IconButton(
                icon: Icon(
                  _isSaved ? Icons.favorite : Icons.favorite_outline,
                  color: _isSaved
                      ? colorScheme.error
                      : colorScheme.onSurfaceVariant,
                  size: 22,
                ),
                onPressed: _toggleSave,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                tooltip: _isSaved ? 'Unsave' : 'Save',
              ),

              // Share button
              IconButton(
                icon: Icon(
                  Icons.share_outlined,
                  color: colorScheme.onSurfaceVariant,
                  size: 22,
                ),
                onPressed: _share,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                tooltip: 'Share',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Category badge
// ---------------------------------------------------------------------------

class _CategoryBadge extends StatelessWidget {
  const _CategoryBadge({required this.category});

  final String category;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colorScheme.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        category.toUpperCase().replaceAll('_', ' '),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

