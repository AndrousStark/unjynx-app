import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';
import '../providers/team_providers.dart';
import '../widgets/team_activity_feed.dart';

/// N3 -- Shared Project View page.
///
/// Team-enhanced project detail with assignee filtering, comment threads,
/// @mention support, and activity feed sidebar.
///
/// Shows an empty state when no team exists.
class SharedProjectPage extends ConsumerStatefulWidget {
  const SharedProjectPage({super.key});

  @override
  ConsumerState<SharedProjectPage> createState() => _SharedProjectPageState();
}

class _SharedProjectPageState extends ConsumerState<SharedProjectPage> {
  String? _selectedAssignee;
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final team = ref.watch(currentTeamValueProvider);
    final members = ref.watch(membersProvider).value ?? [];
    final activities = ref.watch(teamActivityProvider).value ?? [];

    // No team state
    if (team == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Shared Project')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: colorScheme.primary.withValues(
                      alpha: isLight ? 0.1 : 0.12,
                    ),
                  ),
                  child: Icon(
                    Icons.folder_shared_outlined,
                    size: 40,
                    color: colorScheme.primary.withValues(
                      alpha: isLight ? 0.6 : 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'No team found',
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Create a team to share projects and collaborate with your team members.',
                  textAlign: TextAlign.center,
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shared Project'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            onPressed: () => _showAssigneeFilter(context, members),
          ),
        ],
      ),
      body: Row(
        children: [
          // Main content
          Expanded(
            flex: 3,
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(membersProvider);
                ref.invalidate(teamActivityProvider);
              },
              color: colorScheme.primary,
              child: CustomScrollView(
                slivers: [
                  // Project header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // View toggle
                          _ViewToggle(),
                          const SizedBox(height: 16),

                          // Assignee filter chip
                          if (_selectedAssignee != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Chip(
                                label: Text(
                                  'Assigned to: $_selectedAssignee',
                                  style: textTheme.bodySmall?.copyWith(
                                    fontSize: 13,
                                    color: colorScheme.onSurface,
                                  ),
                                ),
                                deleteIcon: const Icon(Icons.close, size: 16),
                                onDeleted: () => setState(
                                  () => _selectedAssignee = null,
                                ),
                                backgroundColor: colorScheme.primary.withValues(
                                  alpha: isLight ? 0.1 : 0.12,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  // Task list placeholder
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: colorScheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: isLight
                              ? Border.all(
                                  color: colorScheme.primary
                                      .withValues(alpha: 0.1),
                                )
                              : null,
                          boxShadow: isLight
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF1A0533)
                                        .withValues(alpha: 0.06),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                  BoxShadow(
                                    color: const Color(0xFF1A0533)
                                        .withValues(alpha: 0.04),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Icon(
                                Icons.task_alt_rounded,
                                size: 48,
                                color: colorScheme.onSurfaceVariant
                                    .withValues(alpha: 0.3),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Shared tasks will appear here',
                                style: textTheme.bodyMedium?.copyWith(
                                  fontSize: 15,
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Assign tasks to team members for collaboration',
                                style: textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onSurfaceVariant
                                      .withValues(alpha: isLight ? 0.6 : 0.5),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 16)),

                  // Comment section
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _CommentSection(
                        controller: _commentController,
                        members: members,
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 32)),
                ],
              ),
            ),
          ),

          // Activity feed sidebar (desktop/tablet only)
          if (MediaQuery.of(context).size.width > 800)
            Container(
              width: 280,
              decoration: BoxDecoration(
                border: Border(
                  left: BorderSide(
                    color: isLight
                        ? colorScheme.outlineVariant.withValues(alpha: 0.3)
                        : ux.glassBorder,
                  ),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TeamActivityFeed(activities: activities),
              ),
            ),
        ],
      ),
    );
  }

  void _showAssigneeFilter(
    BuildContext context,
    List<TeamMember> members,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0xFF1A0533).withValues(alpha: 0.20),
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isLight
                ? Colors.white.withValues(alpha: 0.85)
                : colorScheme.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Filter by Assignee',
                    style: textTheme.headlineSmall?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    leading: const Icon(Icons.people_outline),
                    title: const Text('All Members'),
                    onTap: () => Navigator.of(context).pop(null),
                  ),
                  ...members.map(
                    (m) => ListTile(
                      leading: CircleAvatar(
                        radius: 16,
                        backgroundColor: colorScheme.primary.withValues(
                          alpha: 0.12,
                        ),
                        child: Text(
                          m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                          style: textTheme.labelMedium?.copyWith(
                            color: colorScheme.primary,
                          ),
                        ),
                      ),
                      title: Text(m.name),
                      onTap: () => Navigator.of(context).pop(m.name),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    ).then((name) {
      setState(() => _selectedAssignee = name);
    });
  }
}

class _ViewToggle extends StatefulWidget {
  @override
  State<_ViewToggle> createState() => _ViewToggleState();
}

class _ViewToggleState extends State<_ViewToggle> {
  int _selectedView = 0;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<int>(
      segments: const [
        ButtonSegment(
          value: 0,
          label: Text('List'),
          icon: Icon(Icons.list_rounded, size: 18),
        ),
        ButtonSegment(
          value: 1,
          label: Text('Kanban'),
          icon: Icon(Icons.view_kanban_rounded, size: 18),
        ),
        ButtonSegment(
          value: 2,
          label: Text('Timeline'),
          icon: Icon(Icons.timeline_rounded, size: 18),
        ),
      ],
      selected: {_selectedView},
      onSelectionChanged: (values) {
        HapticFeedback.selectionClick();
        setState(() => _selectedView = values.first);
      },
    );
  }
}

class _CommentSection extends StatelessWidget {
  const _CommentSection({
    required this.controller,
    required this.members,
  });

  final TextEditingController controller;
  final List<TeamMember> members;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: isLight
            ? Border.all(
                color: colorScheme.primary.withValues(alpha: 0.1),
              )
            : null,
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'COMMENTS',
              style: textTheme.labelMedium?.copyWith(
                letterSpacing: 1,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),

            // Empty state
            Center(
              child: Text(
                'No comments yet. Start a conversation!',
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant.withValues(
                    alpha: isLight ? 0.6 : 0.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Comment input with @mention hint
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Add a comment... (use @ to mention)',
                      hintStyle: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant.withValues(
                          alpha: isLight ? 0.5 : 0.4,
                        ),
                      ),
                      filled: true,
                      fillColor: isLight
                          ? colorScheme.surfaceContainerHigh
                              .withValues(alpha: 0.4)
                          : colorScheme.surfaceContainer,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(
                    Icons.send_rounded,
                    color: colorScheme.primary,
                  ),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    final text = controller.text.trim();
                    if (text.isEmpty) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text(
                          'Tap a task to add comments. Project-level discussions coming in v2.',
                        ),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
