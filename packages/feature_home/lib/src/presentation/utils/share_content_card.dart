import 'dart:io';

import 'package:feature_home/src/domain/models/home_models.dart';
import 'package:feature_home/src/presentation/widgets/shareable_content_card.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

/// Generates a premium branded image card from [content] and opens the
/// system share sheet.
///
/// The card is rendered off-screen at 1080x1920 (9:16 Instagram-story ratio)
/// using [ScreenshotController.captureFromLongWidget], saved as a temporary
/// PNG, and shared via [Share.shareXFiles].
///
/// Falls back to plain-text clipboard copy if image generation fails.
Future<void> shareContentCard(
  BuildContext context,
  DailyContent content,
) async {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  final messenger = ScaffoldMessenger.of(context);
  final controller = ScreenshotController();

  try {
    // Build the shareable widget, wrapping with InheritedTheme so that
    // Material widgets render correctly off-screen.
    final widget = InheritedTheme.captureAll(
      context,
      Material(
        color: Colors.transparent,
        child: ShareableContentCard(
          quote: content.content,
          author: content.author,
          category: content.category,
          source: content.source,
          isDark: isDark,
        ),
      ),
    );

    final imageBytes = await controller.captureFromLongWidget(
      widget,
      delay: const Duration(milliseconds: 150),
      pixelRatio: 3,
      context: context,
    );

    // Write to a temp file with a unique name.
    final tempDir = await getTemporaryDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final file = File('${tempDir.path}/unjynx_quote_$timestamp.png');
    await file.writeAsBytes(imageBytes, flush: true);

    // Open system share sheet with the image + fallback text.
    final attribution = content.source != null
        ? '${content.author}, ${content.source}'
        : content.author;

    await Share.shareXFiles(
      [XFile(file.path)],
      text: '\u201C${content.content}\u201D\n\n'
          '\u2014 $attribution\n\n'
          'Shared from UNJYNX | unjynx.me',
    );
  } on Exception catch (e) {
    // Fallback: show error snackbar with context about what happened.
    debugPrint('[shareContentCard] failed: $e');

    messenger.showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Expanded(
              child: Text('Could not generate share card. Please try again.'),
            ),
          ],
        ),
        duration: Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
        ),
      ),
    );
  }
}
