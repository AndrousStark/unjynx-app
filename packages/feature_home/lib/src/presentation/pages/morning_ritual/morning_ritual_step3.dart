import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Step 3: Daily Content Preview
///
/// Displays today's wisdom quote fetched from [homeDailyContentProvider].
/// Shows loading/error states gracefully and invites reflection.
class DailyContentStep extends StatelessWidget {
  const DailyContentStep({super.key, required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final contentAsync = ref.watch(homeDailyContentProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.auto_stories_rounded,
            size: 44,
            color: colorScheme.primary,
          ),
          const SizedBox(height: 24),

          Text(
            "Today's Wisdom",
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          contentAsync.when(
            data: (content) {
              if (content == null) {
                return Text(
                  'No content available today.',
                  style: TextStyle(
                    fontSize: 15,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                );
              }

              return Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: colorScheme.primary.withValues(alpha: 0.2),
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      '\u201C${content.content}\u201D',
                      style: TextStyle(
                        fontSize: 19,
                        fontStyle: FontStyle.italic,
                        color: colorScheme.onSurface,
                        height: 1.6,
                        letterSpacing: 0.2,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 20),

                    Text(
                      '\u2014 ${content.author}'
                      '${content.source != null ? ', ${content.source}' : ''}',
                      style: TextStyle(
                        fontSize: 14,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              );
            },
            loading: () => CircularProgressIndicator(
              color: colorScheme.primary,
              strokeWidth: 2,
            ),
            error: (_, __) => Text(
              'Could not load daily content.',
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            ),
          ),

          const SizedBox(height: 20),

          Text(
            'Reflect on this today',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: context.isLightMode
                  ? ux.gold
                  : ux.gold.withValues(alpha: 0.7),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
