import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

final _workflowsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = _tryRead(ref, workflowApiProvider);
  if (api == null) return const [];
  try {
    final r = await api.getWorkflows();
    if (r.success && r.data != null)
      return r.data!.cast<Map<String, dynamic>>();
  } on DioException {
    // Swallow.
  }
  return const [];
});

final _workflowDetailProvider =
    FutureProvider.family<Map<String, dynamic>?, String>((
      ref,
      workflowId,
    ) async {
      final api = _tryRead(ref, workflowApiProvider);
      if (api == null) return null;
      try {
        final r = await api.getWorkflow(workflowId);
        if (r.success && r.data != null) return r.data!;
      } on DioException {
        // Swallow.
      }
      return null;
    });

// ---------------------------------------------------------------------------
// Page — Master/Detail
// ---------------------------------------------------------------------------

/// Workflow builder page with master (list) / detail (statuses + transitions).
class WorkflowBuilderPage extends ConsumerStatefulWidget {
  const WorkflowBuilderPage({super.key});

  @override
  ConsumerState<WorkflowBuilderPage> createState() =>
      _WorkflowBuilderPageState();
}

class _WorkflowBuilderPageState extends ConsumerState<WorkflowBuilderPage> {
  String? _selectedId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (_selectedId != null) {
      return _WorkflowDetailView(
        workflowId: _selectedId!,
        onBack: () => setState(() => _selectedId = null),
      );
    }

    return _WorkflowListView(
      onSelect: (id) => setState(() => _selectedId = id),
    );
  }
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

class _WorkflowListView extends ConsumerStatefulWidget {
  final ValueChanged<String> onSelect;

  const _WorkflowListView({required this.onSelect});

  @override
  ConsumerState<_WorkflowListView> createState() => _WorkflowListViewState();
}

class _WorkflowListViewState extends ConsumerState<_WorkflowListView> {
  final _nameController = TextEditingController();
  bool _isCreating = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _createWorkflow() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _isCreating = true);
    HapticFeedback.mediumImpact();

    try {
      final api = ref.read(workflowApiProvider);
      final response = await api.createWorkflow(name: name);
      if (response.success) {
        _nameController.clear();
        ref.invalidate(_workflowsProvider);
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create workflow')),
        );
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final workflowsAsync = ref.watch(_workflowsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Workflows'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Create workflow inline form
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _nameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      hintText: 'New workflow name...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _createWorkflow(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _isCreating ? null : _createWorkflow,
                  child: _isCreating
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Create'),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: workflowsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) =>
                  const Center(child: Text('Failed to load workflows')),
              data: (workflows) {
                if (workflows.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.route_rounded,
                          size: 56,
                          color: colorScheme.onSurfaceVariant.withValues(
                            alpha: 0.3,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No custom workflows',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Create workflows with custom statuses\nand transitions.',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(_workflowsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: workflows.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final wf = workflows[i];
                      final name = wf['name'] as String? ?? '';
                      final desc = wf['description'] as String?;
                      final isSystem = wf['isSystem'] as bool? ?? false;
                      final isDefault = wf['isDefault'] as bool? ?? false;

                      return ListTile(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          widget.onSelect(wf['id'] as String);
                        },
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: colorScheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.route_rounded,
                            size: 20,
                            color: colorScheme.primary,
                          ),
                        ),
                        title: Row(
                          children: [
                            Text(
                              name,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (isSystem) ...[
                              const SizedBox(width: 6),
                              _Badge(
                                label: 'System',
                                color: colorScheme.outline,
                              ),
                            ],
                            if (isDefault) ...[
                              const SizedBox(width: 4),
                              _Badge(
                                label: 'Default',
                                color: colorScheme.primary,
                              ),
                            ],
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
                            color: colorScheme.outlineVariant.withValues(
                              alpha: 0.3,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------

class _WorkflowDetailView extends ConsumerWidget {
  final String workflowId;
  final VoidCallback onBack;

  const _WorkflowDetailView({required this.workflowId, required this.onBack});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final detailAsync = ref.watch(_workflowDetailProvider(workflowId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Workflow'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: onBack,
        ),
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load workflow')),
        data: (data) {
          if (data == null) {
            return const Center(child: Text('Workflow not found'));
          }

          final name = data['name'] as String? ?? '';
          final statuses =
              (data['statuses'] as List<dynamic>?)
                  ?.cast<Map<String, dynamic>>() ??
              <Map<String, dynamic>>[];
          final transitions =
              (data['transitions'] as List<dynamic>?)
                  ?.cast<Map<String, dynamic>>() ??
              <Map<String, dynamic>>[];

          return RefreshIndicator(
            onRefresh: () async =>
                ref.invalidate(_workflowDetailProvider(workflowId)),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  name,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),

                // Statuses
                Text(
                  'Statuses',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                if (statuses.isEmpty)
                  Text(
                    'No statuses defined',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                for (final status in statuses) ...[
                  _StatusNode(
                    status: status,
                    colorScheme: colorScheme,
                    theme: theme,
                  ),
                  const SizedBox(height: 6),
                ],

                const SizedBox(height: 20),

                // Transitions
                Text(
                  'Transitions',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                if (transitions.isEmpty)
                  Text(
                    'No transitions defined',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                for (final t in transitions) ...[
                  _TransitionRow(
                    transition: t,
                    statuses: statuses,
                    colorScheme: colorScheme,
                    theme: theme,
                  ),
                  const SizedBox(height: 4),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatusNode extends StatelessWidget {
  final Map<String, dynamic> status;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _StatusNode({
    required this.status,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final name = status['name'] as String? ?? '';
    final category = status['category'] as String? ?? 'todo';
    final color = status['color'] as String?;
    final isInitial = status['isInitial'] as bool? ?? false;
    final isFinal = status['isFinal'] as bool? ?? false;

    final categoryColor = switch (category) {
      'in_progress' => Colors.blue,
      'done' => Colors.green,
      _ => Colors.grey,
    };

    final dotColor = color != null
        ? Color(int.parse('FF${color.replaceAll('#', '')}', radix: 16))
        : categoryColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Text(
            name,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 8),
          _Badge(label: category.replaceAll('_', ' '), color: categoryColor),
          if (isInitial) ...[
            const SizedBox(width: 4),
            _Badge(label: 'Start', color: Colors.green),
          ],
          if (isFinal) ...[
            const SizedBox(width: 4),
            _Badge(label: 'End', color: colorScheme.primary),
          ],
        ],
      ),
    );
  }
}

class _TransitionRow extends StatelessWidget {
  final Map<String, dynamic> transition;
  final List<Map<String, dynamic>> statuses;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _TransitionRow({
    required this.transition,
    required this.statuses,
    required this.colorScheme,
    required this.theme,
  });

  String _statusName(String? id) {
    if (id == null) return '?';
    for (final s in statuses) {
      if (s['id'] == id) return s['name'] as String? ?? '?';
    }
    return '?';
  }

  @override
  Widget build(BuildContext context) {
    final fromId = transition['fromStatusId'] as String?;
    final toId = transition['toStatusId'] as String?;
    final name = transition['name'] as String?;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Text(_statusName(fromId), style: theme.textTheme.bodySmall),
          const SizedBox(width: 6),
          Icon(
            Icons.arrow_forward_rounded,
            size: 14,
            color: colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Text(_statusName(toId), style: theme.textTheme.bodySmall),
          if (name != null) ...[
            const Spacer(),
            Text(
              name,
              style: theme.textTheme.labelSmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
