import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../providers/ai_providers.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/persona_selector.dart';
import '../widgets/quick_action_chips.dart';

/// K1 — AI Chat Screen.
///
/// Full chat interface with:
/// - Persona selector (5 personas as chips)
/// - Streaming message display
/// - Quick action chips
/// - Text input with send button
class AiChatPage extends ConsumerStatefulWidget {
  const AiChatPage({super.key});

  @override
  ConsumerState<AiChatPage> createState() => _AiChatPageState();
}

class _AiChatPageState extends ConsumerState<AiChatPage> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;

    UnjynxHaptics.mediumImpact();
    ref.read(chatMessagesProvider.notifier).sendMessage(text.trim());
    _textController.clear();

    // Scroll to bottom after a frame so the new message is laid out.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatMessagesProvider);
    final isResponding = ref.watch(isAiRespondingProvider);
    final isAiUnavailable = ref.watch(aiUnavailableProvider);
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;
    final unjynx = theme.extension<UnjynxCustomColors>()!;

    // Auto-scroll when new content arrives during streaming
    ref.listen(chatMessagesProvider, (prev, next) {
      if (_scrollController.hasClients) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 100),
              curve: Curves.easeOut,
            );
          }
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'AI Assistant',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (messages.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded),
              tooltip: 'Clear chat',
              onPressed: () {
                UnjynxHaptics.lightImpact();
                ref.read(chatMessagesProvider.notifier).clearChat();
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // AI unavailable banner
          if (isAiUnavailable)
            _AiComingSoonBanner(isLight: isLight, unjynx: unjynx),

          // Persona selector
          const Padding(
            padding: EdgeInsets.only(top: 4, bottom: 8),
            child: PersonaSelector(),
          ),

          const Divider(height: 1),

          // Messages area
          Expanded(
            child: messages.isEmpty
                ? _EmptyChatState(unjynx: unjynx, isLight: isLight)
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      return ChatBubble(
                        content: msg.content,
                        isUser: msg.role == 'user',
                        isStreaming: msg.isStreaming,
                      );
                    },
                  ),
          ),

          // Quick action chips (only when chat is empty or not responding)
          if (messages.isEmpty || (!isResponding && messages.length < 3))
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: QuickActionChips(
                onChipTapped: _sendMessage,
              ),
            ),

          // Input area
          _ChatInputBar(
            controller: _textController,
            focusNode: _focusNode,
            isResponding: isResponding,
            isLight: isLight,
            unjynx: unjynx,
            onSend: () => _sendMessage(_textController.text),
          ),
        ],
      ),
    );
  }
}

/// Empty state shown when there are no messages.
class _EmptyChatState extends StatelessWidget {
  const _EmptyChatState({
    required this.unjynx,
    required this.isLight,
  });

  final UnjynxCustomColors unjynx;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: isLight
                    ? UnjynxLightColors.brandViolet.withValues(alpha: 0.1)
                    : UnjynxDarkColors.brandViolet.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.auto_awesome_rounded,
                size: 40,
                color: isLight
                    ? UnjynxLightColors.brandViolet
                    : UnjynxDarkColors.brandViolet,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'UNJYNX AI',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                fontFamily: 'BebasNeue',
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your productivity assistant.\nAsk anything about your tasks.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isLight
                    ? UnjynxLightColors.textTertiary
                    : UnjynxDarkColors.textTertiary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Banner shown when the AI backend is not configured.
class _AiComingSoonBanner extends StatelessWidget {
  const _AiComingSoonBanner({
    required this.isLight,
    required this.unjynx,
  });

  final bool isLight;
  final UnjynxCustomColors unjynx;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: isLight
          ? unjynx.gold.withValues(alpha: 0.12)
          : unjynx.gold.withValues(alpha: 0.08),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            size: 18,
            color: unjynx.gold,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'AI features coming soon -- the service is being set up.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isLight
                    ? UnjynxLightColors.textSecondary
                    : UnjynxDarkColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Chat input bar with text field and send button.
class _ChatInputBar extends StatelessWidget {
  const _ChatInputBar({
    required this.controller,
    required this.focusNode,
    required this.isResponding,
    required this.isLight,
    required this.unjynx,
    required this.onSend,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isResponding;
  final bool isLight;
  final UnjynxCustomColors unjynx;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bottomPadding = MediaQuery.viewInsetsOf(context).bottom;

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 8,
        top: 8,
        bottom: 8 + bottomPadding,
      ),
      decoration: BoxDecoration(
        color: isLight
            ? UnjynxLightColors.surface
            : UnjynxDarkColors.surface,
        border: Border(
          top: BorderSide(
            color: isLight
                ? UnjynxLightColors.surfaceContainer
                : UnjynxDarkColors.surfaceContainer,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              enabled: !isResponding,
              maxLines: 4,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              style: theme.textTheme.bodyMedium,
              decoration: InputDecoration(
                hintText: isResponding
                    ? 'UNJYNX is thinking...'
                    : 'Ask UNJYNX anything...',
                hintStyle: theme.textTheme.bodyMedium?.copyWith(
                  color: isLight
                      ? UnjynxLightColors.textDisabled
                      : UnjynxDarkColors.textDisabled,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: isLight
                    ? UnjynxLightColors.surfaceContainer
                    : UnjynxDarkColors.surfaceContainer,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                isDense: true,
              ),
            ),
          ),
          const SizedBox(width: 8),
          PressableScale(
            onTap: isResponding ? null : onSend,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isResponding
                    ? (isLight
                        ? UnjynxLightColors.textDisabled
                        : UnjynxDarkColors.textDisabled)
                    : (isLight
                        ? UnjynxLightColors.brandViolet
                        : UnjynxDarkColors.brandViolet),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isResponding ? Icons.hourglass_top_rounded : Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
