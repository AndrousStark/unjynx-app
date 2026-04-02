import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

import '../providers/sprint_providers.dart';

/// Create a new sprint for the current project.
class CreateSprintPage extends ConsumerStatefulWidget {
  const CreateSprintPage({super.key});

  @override
  ConsumerState<CreateSprintPage> createState() => _CreateSprintPageState();
}

class _CreateSprintPageState extends ConsumerState<CreateSprintPage> {
  final _nameController = TextEditingController();
  final _goalController = TextEditingController();
  DateTimeRange? _dateRange;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _goalController.dispose();
    super.dispose();
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange:
          _dateRange ??
          DateTimeRange(start: now, end: now.add(const Duration(days: 14))),
    );
    if (picked != null) {
      setState(() => _dateRange = picked);
    }
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    final projectId = ref.read(sprintProjectIdProvider);
    if (projectId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('No project selected')));
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    try {
      final api = ref.read(sprintApiProvider);
      final response = await api.createSprint(
        projectId: projectId,
        name: name,
        goal: _goalController.text.trim().isEmpty
            ? null
            : _goalController.text.trim(),
        startDate: _dateRange?.start.toIso8601String(),
        endDate: _dateRange?.end.toIso8601String(),
      );

      if (!mounted) return;

      if (response.success) {
        ref.invalidate(sprintsProvider);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Sprint created')));
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.error ?? 'Failed to create sprint')),
        );
      }
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Sprint'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Name
          TextFormField(
            controller: _nameController,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              labelText: 'Sprint Name',
              hintText: 'e.g. Sprint 12 — Auth Revamp',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Goal
          TextFormField(
            controller: _goalController,
            maxLines: 3,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              labelText: 'Sprint Goal (optional)',
              hintText: 'What should this sprint accomplish?',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Date range
          ListTile(
            onTap: _pickDateRange,
            leading: Icon(Icons.date_range_rounded, color: colorScheme.primary),
            title: Text(
              _dateRange != null
                  ? '${_formatDate(_dateRange!.start)} — ${_formatDate(_dateRange!.end)}'
                  : 'Pick date range',
              style: theme.textTheme.bodyMedium,
            ),
            subtitle: _dateRange != null
                ? Text(
                    '${_dateRange!.duration.inDays} days',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  )
                : null,
            trailing: const Icon(Icons.chevron_right_rounded),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: colorScheme.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Submit
          FilledButton(
            onPressed: _isSubmitting ? null : _submit,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Create Sprint'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) => '${d.day}/${d.month}/${d.year}';
}
