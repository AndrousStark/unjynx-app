import 'package:flutter/material.dart';

import '../theme/unjynx_extensions.dart';

/// Canonical UNJYNX priority color mapping.
///
/// Provides a single source of truth for priority-to-color conversion.
/// Works with any priority enum via its `.name` property.
///
/// Color semantics:
/// - **urgent** -> error (red) -- universal danger signal
/// - **high** -> amber/orange -- warm warning
/// - **medium** -> warning (yellow) -- moderate attention
/// - **low** -> primary (purple) -- calm brand accent
/// - **none/unknown** -> onSurfaceVariant (gray) -- no emphasis
Color unjynxPriorityColor(BuildContext context, String priority) {
  final colorScheme = Theme.of(context).colorScheme;
  final ux = context.unjynx;
  final isLight = context.isLightMode;

  return switch (priority.toLowerCase()) {
    'urgent' => colorScheme.error,
    'high' => isLight
        ? const Color(0xFFD97706) // amber-600
        : const Color(0xFFFFD43B), // yellow-300
    'medium' => ux.warning,
    'low' => colorScheme.primary,
    _ => colorScheme.onSurfaceVariant,
  };
}
