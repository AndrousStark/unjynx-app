import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/export_format.dart';

/// Summary card shown after an import completes.
class ImportSummaryCard extends StatelessWidget {
  const ImportSummaryCard({required this.result, super.key});

  final ImportResult result;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isLight
            ? BorderSide(color: ux.success.withValues(alpha: 0.3))
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Success icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: ux.success.withValues(alpha: isLight ? 0.12 : 0.15),
              ),
              child: Icon(
                Icons.check_rounded,
                size: 32,
                color: ux.success,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Import Complete',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 20),

            // Stats grid
            Row(
              children: [
                Expanded(
                  child: _StatItem(
                    label: 'Imported',
                    value: '${result.imported}',
                    color: ux.success,
                  ),
                ),
                Expanded(
                  child: _StatItem(
                    label: 'Skipped',
                    value: '${result.skipped}',
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatItem(
                    label: 'Duplicates',
                    value: '${result.duplicates}',
                    color: ux.warning,
                  ),
                ),
                Expanded(
                  child: _StatItem(
                    label: 'Errors',
                    value: '${result.errors}',
                    color: result.errors > 0 ? colorScheme.error : ux.success,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
