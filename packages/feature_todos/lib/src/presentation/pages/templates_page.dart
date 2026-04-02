import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';

// ---------------------------------------------------------------------------
// API-backed templates provider
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

/// Fetches templates from the API, falling back to built-in system templates.
final apiTemplatesProvider = FutureProvider<List<TaskTemplate>>((ref) async {
  final api = _tryRead(ref, templateApiProvider);
  if (api == null) return _systemTemplates;

  try {
    final response = await api.getTemplates();
    if (response.success &&
        response.data != null &&
        response.data!.isNotEmpty) {
      return response.data!.map((e) {
        final m = e as Map<String, dynamic>;
        final subtasksRaw = m['subtasks'];
        final subtaskTitles = <String>[];
        if (subtasksRaw is List) {
          for (final s in subtasksRaw) {
            if (s is Map) {
              subtaskTitles.add(s['title'] as String? ?? '');
            } else if (s is String) {
              subtaskTitles.add(s);
            }
          }
        }
        return TaskTemplate(
          id: m['id'] as String? ?? '',
          name: m['title'] as String? ?? '',
          description: m['description'] as String?,
          category: m['category'] as String? ?? 'personal',
          isSystem: m['isGlobal'] as bool? ?? false,
          priority: _parsePriority(m['priority'] as String?),
          subtasks: subtaskTitles,
        );
      }).toList();
    }
  } on DioException {
    // API unavailable — fall back to built-in.
  }

  return _systemTemplates;
});

TodoPriority? _parsePriority(String? p) {
  if (p == null) return null;
  return TodoPriority.values.where((v) => v.name == p).firstOrNull;
}

/// Template data model for display (not Drift, uses JSON from templates table).
class TaskTemplate {
  final String id;
  final String name;
  final String? description;
  final String category;
  final bool isSystem;
  final TodoPriority? priority;
  final List<String> subtasks;

  const TaskTemplate({
    required this.id,
    required this.name,
    this.description,
    this.category = 'personal',
    this.isSystem = false,
    this.priority,
    this.subtasks = const [],
  });
}

/// Built-in system templates.
const _systemTemplates = [
  TaskTemplate(
    id: 'sys-weekly-review',
    name: 'Weekly Review',
    description: 'End-of-week review and planning',
    category: 'productivity',
    isSystem: true,
    priority: TodoPriority.high,
    subtasks: [
      'Review completed tasks',
      'Check progress on goals',
      'Clear inbox to zero',
      'Plan next week priorities',
      'Schedule focused time blocks',
    ],
  ),
  TaskTemplate(
    id: 'sys-morning-routine',
    name: 'Morning Routine',
    description: 'Start the day right',
    category: 'wellness',
    isSystem: true,
    subtasks: [
      'Hydrate (glass of water)',
      '5-min meditation or breathing',
      'Review today\'s tasks',
      'Set top 3 priorities',
    ],
  ),
  TaskTemplate(
    id: 'sys-meeting-prep',
    name: 'Meeting Preparation',
    description: 'Prepare for an effective meeting',
    category: 'professional',
    isSystem: true,
    priority: TodoPriority.medium,
    subtasks: [
      'Review agenda',
      'Prepare talking points',
      'Gather required documents',
      'Set meeting goal',
    ],
  ),
  TaskTemplate(
    id: 'sys-project-kickoff',
    name: 'Project Kickoff',
    description: 'Start a new project the right way',
    category: 'professional',
    isSystem: true,
    priority: TodoPriority.high,
    subtasks: [
      'Define project scope',
      'Identify stakeholders',
      'Set milestones and deadlines',
      'Create task breakdown',
      'Schedule kickoff meeting',
      'Set up project workspace',
    ],
  ),
  TaskTemplate(
    id: 'sys-bug-fix',
    name: 'Bug Fix Workflow',
    description: 'Systematic approach to fixing bugs',
    category: 'development',
    isSystem: true,
    priority: TodoPriority.urgent,
    subtasks: [
      'Reproduce the bug',
      'Identify root cause',
      'Write failing test',
      'Implement fix',
      'Verify test passes',
      'Code review',
      'Deploy and monitor',
    ],
  ),
];

/// D6 - Task Templates screen.
///
/// Browse system and user templates, apply to create tasks.
/// Free: 5 built-in | Pro: unlimited.
class TemplatesPage extends ConsumerWidget {
  const TemplatesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templatesAsync = ref.watch(apiTemplatesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Templates'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              HapticFeedback.lightImpact();
              _showInfo(context);
            },
          ),
        ],
      ),
      body: templatesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _buildTemplateList(context, ref, _systemTemplates),
        data: (templates) => _buildTemplateList(context, ref, templates),
      ),
    );
  }

  Widget _buildTemplateList(
    BuildContext context,
    WidgetRef ref,
    List<TaskTemplate> templates,
  ) {
    final colorScheme = Theme.of(context).colorScheme;

    // Group templates by category
    final grouped = <String, List<TaskTemplate>>{};
    for (final t in templates) {
      grouped.putIfAbsent(t.category, () => []).add(t);
    }

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(apiTemplatesProvider),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Start faster with templates',
            style: TextStyle(fontSize: 15, color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 20),
          for (final entry in grouped.entries) ...[
            _CategoryHeader(category: entry.key),
            const SizedBox(height: 8),
            for (final template in entry.value)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _TemplateCard(
                  template: template,
                  onApply: () => _applyTemplate(context, ref, template),
                ),
              ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  Future<void> _applyTemplate(
    BuildContext context,
    WidgetRef ref,
    TaskTemplate template,
  ) async {
    final ux = context.unjynx;
    HapticFeedback.mediumImpact();

    // Try API-based template usage first (creates task + subtasks server-side).
    TemplateApiService? api;
    try {
      api = ref.read(templateApiProvider);
    } catch (_) {
      api = null;
    }
    if (api != null && !template.id.startsWith('sys-')) {
      try {
        final response = await api.useTemplate(template.id);
        if (response.success) {
          ref.invalidate(todoListProvider);
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Created "${template.name}" with '
                  '${template.subtasks.length} subtasks',
                ),
                backgroundColor: ux.success,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            );
          }
          return;
        }
      } on DioException {
        // Fall through to local creation.
      }
    }

    // Fallback: create locally.
    final createTodo = ref.read(createTodoProvider);
    await createTodo(
      title: template.name,
      priority: template.priority ?? TodoPriority.none,
    );

    ref.invalidate(todoListProvider);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Created "${template.name}" with '
            '${template.subtasks.length} subtasks',
          ),
          backgroundColor: ux.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  }

  void _showInfo(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        return AlertDialog(
          backgroundColor: cs.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Text('About Templates', style: TextStyle(color: cs.onSurface)),
          content: Text(
            'Templates let you quickly create tasks with predefined '
            'subtasks and settings.\n\n'
            'Free: 5 built-in templates\n'
            'Pro: Create unlimited custom templates',
            style: TextStyle(color: cs.onSurfaceVariant),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Got it', style: TextStyle(color: cs.primary)),
            ),
          ],
        );
      },
    );
  }
}

// =============================================================================
// Supporting widgets
// =============================================================================

class _CategoryHeader extends StatelessWidget {
  const _CategoryHeader({required this.category});

  final String category;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final label = category[0].toUpperCase() + category.substring(1);
    final icon = switch (category) {
      'productivity' => Icons.speed,
      'wellness' => Icons.self_improvement,
      'professional' => Icons.business_center,
      'development' => Icons.code,
      _ => Icons.category,
    };

    return Row(
      children: [
        Icon(icon, size: 18, color: colorScheme.primary),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}

class _TemplateCard extends StatelessWidget {
  const _TemplateCard({required this.template, required this.onApply});

  final TaskTemplate template;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        // Light: white card with purple-tinted border; Dark: surface
        color: isLight ? Colors.white : colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isLight
              ? colorScheme.primary.withValues(alpha: 0.1)
              : colorScheme.surfaceContainerHigh,
        ),
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: ux.shadowBase.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            HapticFeedback.lightImpact();
            _showDetail(context);
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        template.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        onApply();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          // Light: goldWash bg; Dark: gold at 15%
                          color: isLight
                              ? ux.goldWash
                              : ux.gold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: ux.gold.withValues(
                              alpha: isLight ? 0.3 : 0.4,
                            ),
                          ),
                        ),
                        child: Text(
                          'Use',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: ux.gold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                if (template.description != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    template.description!,
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.checklist,
                      size: 14,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.8 : 0.7,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${template.subtasks.length} subtasks',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant.withValues(
                          alpha: isLight ? 0.8 : 0.7,
                        ),
                      ),
                    ),
                    if (template.priority != null) ...[
                      const SizedBox(width: 12),
                      Icon(
                        Icons.flag,
                        size: 14,
                        color: unjynxPriorityColor(
                          context,
                          template.priority!.name,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        template.priority!.name,
                        style: TextStyle(
                          fontSize: 12,
                          color: unjynxPriorityColor(
                            context,
                            template.priority!.name,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showDetail(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final colorScheme = Theme.of(context).colorScheme;
        final ux = context.unjynx;
        final isLight = context.isLightMode;

        return Container(
          decoration: BoxDecoration(
            // Light: white sheet; Dark: surface
            color: isLight ? Colors.white : colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    template.name,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  if (template.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      template.description!,
                      style: TextStyle(
                        fontSize: 14,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Text(
                    'Subtasks',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final subtask in template.subtasks)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: colorScheme.onSurfaceVariant.withValues(
                                  alpha: isLight ? 0.3 : 0.4,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            subtask,
                            style: TextStyle(
                              fontSize: 15,
                              color: colorScheme.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        Navigator.pop(context);
                        onApply();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ux.gold,
                        // Light gold needs white text; Dark gold needs black
                        foregroundColor: isLight ? Colors.white : Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Use This Template',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
