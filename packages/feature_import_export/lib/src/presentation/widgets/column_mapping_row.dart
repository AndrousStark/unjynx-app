import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/import_preview.dart';

/// A single row in the column mapping UI.
///
/// Shows source column name with a dropdown to select the UNJYNX target field.
class ColumnMappingRow extends StatelessWidget {
  const ColumnMappingRow({
    required this.sourceColumn,
    required this.currentMapping,
    required this.onChanged,
    super.key,
  });

  final String sourceColumn;
  final String? currentMapping;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          // Source column label
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: isLight
                    ? colorScheme.surfaceContainerHigh.withValues(alpha: 0.5)
                    : colorScheme.surfaceContainer,
              ),
              child: Text(
                sourceColumn,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Arrow
          Icon(
            Icons.arrow_forward_rounded,
            size: 18,
            color: colorScheme.onSurfaceVariant.withValues(
              alpha: isLight ? 0.5 : 0.4,
            ),
          ),
          const SizedBox(width: 8),

          // Target field dropdown
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isLight
                      ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                      : colorScheme.surfaceContainerHigh,
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: currentMapping,
                  isExpanded: true,
                  hint: Text(
                    'Select field',
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.5 : 0.4,
                      ),
                    ),
                  ),
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurface,
                  ),
                  dropdownColor: colorScheme.surface,
                  items: ImportTargetFields.all
                      .map(
                        (field) => DropdownMenuItem(
                          value: field,
                          child: Text(
                            field,
                            style: TextStyle(
                              color: field == ImportTargetFields.skip
                                  ? colorScheme.onSurfaceVariant
                                  : null,
                              fontStyle: field == ImportTargetFields.skip
                                  ? FontStyle.italic
                                  : null,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: onChanged,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
