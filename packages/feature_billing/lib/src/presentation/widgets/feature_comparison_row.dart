import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A single row in the feature comparison table.
class FeatureComparisonRowWidget extends StatelessWidget {
  const FeatureComparisonRowWidget({
    required this.feature,
    required this.freeValue,
    required this.proValue,
    required this.teamValue,
    this.isHeader = false,
    super.key,
  });

  final String feature;
  final String freeValue;
  final String proValue;
  final String teamValue;
  final bool isHeader;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isHeader
            ? colorScheme.primary.withValues(alpha: isLight ? 0.06 : 0.1)
            : null,
        border: Border(
          bottom: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              feature,
              style: isHeader
                  ? textTheme.labelMedium?.copyWith(
                      color: colorScheme.primary,
                    )
                  : textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurface,
                    ),
            ),
          ),
          Expanded(
            flex: 2,
            child: _ValueCell(
              value: freeValue,
              isHeader: isHeader,
            ),
          ),
          Expanded(
            flex: 2,
            child: _ValueCell(
              value: proValue,
              isHeader: isHeader,
              isHighlighted: true,
            ),
          ),
          Expanded(
            flex: 2,
            child: _ValueCell(
              value: teamValue,
              isHeader: isHeader,
            ),
          ),
        ],
      ),
    );
  }
}

class _ValueCell extends StatelessWidget {
  const _ValueCell({
    required this.value,
    this.isHeader = false,
    this.isHighlighted = false,
  });

  final String value;
  final bool isHeader;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;

    // Show checkmark / X for Yes/No values.
    if (!isHeader && (value == 'Yes' || value == 'No')) {
      return Center(
        child: Icon(
          value == 'Yes' ? Icons.check_rounded : Icons.close_rounded,
          size: 18,
          color: value == 'Yes'
              ? ux.success
              : const Color(0xFFE11D48),
        ),
      );
    }

    return Text(
      value,
      textAlign: TextAlign.center,
      style: isHeader
          ? textTheme.labelMedium?.copyWith(
              color: colorScheme.primary,
            )
          : textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
              color: isHighlighted
                  ? ux.gold
                  : colorScheme.onSurfaceVariant,
            ),
    );
  }
}
