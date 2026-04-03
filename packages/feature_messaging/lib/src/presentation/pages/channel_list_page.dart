import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

import '../providers/messaging_providers.dart';

/// Team messaging channel list.
///
/// Shows all channels with unread badges. Tap to open chat.
/// FAB to create a new channel.
class ChannelListPage extends ConsumerStatefulWidget {
  const ChannelListPage({super.key});

  @override
  ConsumerState<ChannelListPage> createState() => _ChannelListPageState();
}

class _ChannelListPageState extends ConsumerState<ChannelListPage> {
  Future<void> _createChannel() async {
    final nameCtl = TextEditingController();
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'New Channel',
              style: Theme.of(
                ctx,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtl,
              autofocus: true,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                hintText: 'Channel name',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                final name = nameCtl.text.trim();
                if (name.isEmpty) return;
                HapticFeedback.mediumImpact();
                try {
                  final api = ref.read(messagingApiProvider);
                  final response = await api.createChannel(name: name);
                  if (response.success) {
                    ref.invalidate(channelsProvider);
                    if (ctx.mounted) Navigator.pop(ctx, true);
                  }
                } on DioException {
                  // Swallow.
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
    nameCtl.dispose();
    if (result == true) {
      ref.invalidate(channelsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final channelsAsync = ref.watch(channelsProvider);
    final unreadAsync = ref.watch(unreadCountsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createChannel,
        child: const Icon(Icons.add_rounded),
      ),
      body: channelsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load channels')),
        data: (channels) {
          if (channels.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.forum_rounded,
                    size: 56,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No channels yet',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create a channel to start messaging\nyour team.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          final unreadMap = unreadAsync.value ?? {};

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(channelsProvider);
              ref.invalidate(unreadCountsProvider);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: channels.length,
              separatorBuilder: (_, __) => const SizedBox(height: 6),
              itemBuilder: (_, i) {
                final ch = channels[i];
                final name = ch['name'] as String? ?? '';
                final desc = ch['description'] as String?;
                final id = ch['id'] as String? ?? '';
                final unread = (unreadMap[id] as num?)?.toInt() ?? 0;

                return ListTile(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ref.read(selectedChannelProvider.notifier).set(id);
                    context.push('/messaging/$id');
                  },
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        '#',
                        style: TextStyle(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (unread > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: colorScheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$unread',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  subtitle: desc != null
                      ? Text(
                          desc,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        )
                      : null,
                  trailing: const Icon(Icons.chevron_right_rounded),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
