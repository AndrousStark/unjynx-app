import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/utils/share_content_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Full content feed screen -- "Daily Wisdom".
///
/// Displays a hero card for today's content with category badge, italic quote,
/// author attribution, and save/share actions. Below the hero card, a "Recent"
/// section shows the last 7 days of content items.
///
/// A floating action button navigates to the category selector.
class ContentFeedPage extends ConsumerWidget {
  const ContentFeedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final todayAsync = ref.watch(homeDailyContentProvider);
    final recentAsync = ref.watch(recentContentProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.auto_awesome,
              color: ux.gold,
              size: 22,
            ),
            const SizedBox(width: 8),
            Text(
              'Daily Wisdom',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
          ],
        ),
        backgroundColor: colorScheme.surfaceContainerLowest,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/content/categories'),
        backgroundColor: ux.gold,
        foregroundColor: context.isLightMode ? Colors.white : Colors.black,
        icon: const Icon(Icons.category_rounded),
        label: const Text(
          'Explore Categories',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: todayAsync.when(
        data: (content) => _FeedContent(
          todayContent: content,
          recentAsync: recentAsync,
          onRefresh: () async {
            ref.invalidate(homeDailyContentProvider);
            ref.invalidate(recentContentProvider);
          },
        ),
        loading: () => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const UnjynxShimmerBox(
                height: 280,
                width: double.infinity,
                borderRadius: 16,
              ),
              const SizedBox(height: 32),
              const UnjynxShimmerLine(width: 80, height: 20),
              const SizedBox(height: 12),
              ...List.generate(3, (_) => const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: UnjynxShimmerBox(
                  height: 100,
                  width: double.infinity,
                  borderRadius: 16,
                ),
              )),
            ],
          ),
        ),
        error: (error, _) => _ErrorView(error: error),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Feed content -- hero card + recent list
// ---------------------------------------------------------------------------

class _FeedContent extends StatelessWidget {
  const _FeedContent({
    required this.todayContent,
    required this.recentAsync,
    required this.onRefresh,
  });

  final DailyContent? todayContent;
  final AsyncValue<List<DailyContent>> recentAsync;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    if (todayContent == null) {
      return const _EmptyState();
    }

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: onRefresh,
      child: CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
          sliver: SliverList.list(
            children: [
              // Hero card.
              _HeroContentCard(content: todayContent!),

              const SizedBox(height: 32),

              // Recent section header.
              const _SectionHeader(title: 'Recent'),

              const SizedBox(height: 12),
            ],
          ),
        ),

        // Recent content list.
        recentAsync.when(
          data: (items) => items.isEmpty
              ? SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverToBoxAdapter(
                    child: _RecentEmptyHint(),
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) =>
                        _RecentContentItem(content: items[index]),
                  ),
                ),
          loading: () => SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList.list(
              children: List.generate(3, (_) => const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: UnjynxShimmerBox(
                  height: 100,
                  width: double.infinity,
                  borderRadius: 16,
                ),
              )),
            ),
          ),
          error: (_, __) => const SliverToBoxAdapter(
            child: SizedBox.shrink(),
          ),
        ),

        // Bottom padding so FAB doesn't overlap last item.
        const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
      ],
    ),
    );
  }
}

// ---------------------------------------------------------------------------
// Hero content card -- today's featured content
// ---------------------------------------------------------------------------

class _HeroContentCard extends ConsumerStatefulWidget {
  const _HeroContentCard({required this.content});

  final DailyContent content;

  @override
  ConsumerState<_HeroContentCard> createState() => _HeroContentCardState();
}

class _HeroContentCardState extends ConsumerState<_HeroContentCard> {
  late bool _isSaved;

  @override
  void initState() {
    super.initState();
    _isSaved = widget.content.isSaved;
  }

  @override
  void didUpdateWidget(covariant _HeroContentCard oldWidget) {
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
    await HapticFeedback.mediumImpact();
    if (!mounted) return;
    await shareContentCard(context, widget.content);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final content = widget.content;

    final isLight = context.isLightMode;

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isLight
              ? [colorScheme.surfaceContainerLowest, const Color(0xFFF0EAFC)]
              : [ux.deepPurple, colorScheme.surface],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isLight
              ? colorScheme.primary.withValues(alpha: 0.15)
              : colorScheme.primary.withValues(alpha: 0.3),
        ),
        boxShadow: context.unjynxShadow(UnjynxElevation.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label: "TODAY'S WISDOM".
          Row(
            children: [
              Icon(
                Icons.auto_awesome,
                size: 16,
                color: ux.gold,
              ),
              const SizedBox(width: 6),
              Text(
                "TODAY'S WISDOM",
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isLight ? ux.gold : ux.gold.withValues(alpha: 0.8),
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Category badge.
          _CategoryBadge(category: content.category),

          const SizedBox(height: 20),

          // Quote text -- large, centered, italic (Playfair Display).
          Center(
            child: Padding(
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
                textAlign: TextAlign.center,
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Attribution + actions.
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Author / source.
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

              // Save button (48dp touch target).
              IconButton(
                icon: Icon(
                  _isSaved ? Icons.favorite : Icons.favorite_outline,
                  color: _isSaved
                      ? colorScheme.error
                      : colorScheme.onSurfaceVariant,
                  size: 24,
                ),
                onPressed: _toggleSave,
                padding: EdgeInsets.zero,
                constraints:
                    const BoxConstraints(minWidth: 48, minHeight: 48),
                tooltip: _isSaved ? 'Unsave quote' : 'Save quote',
              ),

              // Share button (48dp touch target).
              IconButton(
                icon: Icon(
                  Icons.share_outlined,
                  color: colorScheme.onSurfaceVariant,
                  size: 24,
                ),
                onPressed: _share,
                padding: EdgeInsets.zero,
                constraints:
                    const BoxConstraints(minWidth: 48, minHeight: 48),
                tooltip: 'Share quote',
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
        color: colorScheme.primary.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        category.toUpperCase().replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: colorScheme.primary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Text(
      title,
      style: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: colorScheme.onSurface,
        letterSpacing: -0.3,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Recent content item -- compact card
// ---------------------------------------------------------------------------

class _RecentContentItem extends StatelessWidget {
  const _RecentContentItem({required this.content});

  final DailyContent content;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
        ),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category badge.
          _CategoryBadge(category: content.category),

          const SizedBox(height: 10),

          // Quote text (truncated, Playfair Display).
          Text(
            '\u201C${content.content}\u201D',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontFamily: 'Playfair Display',
              fontStyle: FontStyle.italic,
              fontWeight: FontWeight.w500,
              fontSize: 14,
              height: 1.4,
              color: colorScheme.onSurface,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 8),

          // Attribution.
          Text(
            '\u2014 ${content.author}'
            '${content.source != null ? ', ${content.source}' : ''}',
            style: TextStyle(
              fontSize: 12,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Recent empty hint
// ---------------------------------------------------------------------------

class _RecentEmptyHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.history_rounded,
            size: 40,
            color: colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 12),
          Text(
            'Your recent content will appear here',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state -- no content at all
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.auto_awesome,
              size: 64,
              color: ux.gold.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 24),
            Text(
              'No content yet',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Select your categories to start\nreceiving daily wisdom!',
              style: TextStyle(
                fontSize: 15,
                color: colorScheme.onSurfaceVariant,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => context.go('/content/categories'),
              icon: const Icon(Icons.category_rounded),
              label: const Text('Pick Categories'),
              style: ElevatedButton.styleFrom(
                backgroundColor: ux.gold,
                foregroundColor:
                    context.isLightMode ? Colors.white : Colors.black,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error view
// ---------------------------------------------------------------------------

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load content',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
