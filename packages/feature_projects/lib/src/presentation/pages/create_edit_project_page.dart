import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import '../widgets/color_picker.dart';
import '../widgets/icon_picker.dart';

/// E3 -- Full-page Create/Edit Project with all fields.
///
/// Fields: Name, Description, Color picker (18+ presets), Icon picker (searchable),
/// Default view selector, Template selector, Visibility, Due date, Team members.
class CreateEditProjectPage extends ConsumerStatefulWidget {
  const CreateEditProjectPage({this.projectId, super.key});

  /// If non-null, editing an existing project.
  final String? projectId;

  bool get isEditing => projectId != null;

  @override
  ConsumerState<CreateEditProjectPage> createState() =>
      _CreateEditProjectPageState();
}

class _CreateEditProjectPageState
    extends ConsumerState<CreateEditProjectPage> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _color = '#6C5CE7';
  String _icon = 'folder';
  _DefaultView _defaultView = _DefaultView.list;
  _ProjectVisibility _visibility = _ProjectVisibility.personal;
  DateTime? _dueDate;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.isEditing) {
      // Load existing project data in post-frame callback
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadExistingProject();
      });
    }
  }

  void _loadExistingProject() {
    final project =
        ref.read(projectByIdProvider(widget.projectId!)).valueOrNull;
    if (project != null) {
      setState(() {
        _nameController.text = project.name;
        _descriptionController.text = project.description ?? '';
        _color = project.color;
        _icon = project.icon;
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEditing ? 'Edit Project' : 'New Project'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Name
          _SectionLabel(label: 'Name'),
          const SizedBox(height: 8),
          TextField(
            controller: _nameController,
            autofocus: !widget.isEditing,
            style: TextStyle(color: colorScheme.onSurface),
            decoration: _inputDecoration('Project name'),
          ),
          const SizedBox(height: 20),

          // Description
          _SectionLabel(label: 'Description'),
          const SizedBox(height: 8),
          TextField(
            controller: _descriptionController,
            style: TextStyle(color: colorScheme.onSurface),
            maxLines: 3,
            minLines: 2,
            decoration: _inputDecoration('What is this project about?'),
          ),
          const SizedBox(height: 20),

          // Color picker
          _SectionLabel(label: 'Color'),
          const SizedBox(height: 12),
          ColorPicker(
            selectedColor: _color,
            onColorSelected: (c) {
              HapticFeedback.selectionClick();
              setState(() => _color = c);
            },
          ),
          // Custom hex for Pro
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: ux.goldWash,
              border: Border.all(color: ux.gold.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.palette_outlined, size: 16, color: ux.gold),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Custom hex color available for Pro subscribers',
                    style: TextStyle(
                      fontSize: 12,
                      color: ux.darkGold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Icon picker
          _SectionLabel(label: 'Icon'),
          const SizedBox(height: 12),
          IconPicker(
            selectedIcon: _icon,
            onIconSelected: (i) {
              HapticFeedback.selectionClick();
              setState(() => _icon = i);
            },
          ),
          const SizedBox(height: 20),

          // Default view selector
          _SectionLabel(label: 'Default View'),
          const SizedBox(height: 8),
          SegmentedButton<_DefaultView>(
            segments: const [
              ButtonSegment(
                value: _DefaultView.list,
                label: Text('List'),
                icon: Icon(Icons.list_rounded, size: 18),
              ),
              ButtonSegment(
                value: _DefaultView.kanban,
                label: Text('Kanban'),
                icon: Icon(Icons.view_kanban_rounded, size: 18),
              ),
              ButtonSegment(
                value: _DefaultView.timeline,
                label: Text('Timeline'),
                icon: Icon(Icons.timeline_rounded, size: 18),
              ),
            ],
            selected: {_defaultView},
            onSelectionChanged: (views) {
              HapticFeedback.selectionClick();
              setState(() => _defaultView = views.first);
            },
          ),
          const SizedBox(height: 20),

          // Visibility
          _SectionLabel(label: 'Visibility'),
          const SizedBox(height: 8),
          SegmentedButton<_ProjectVisibility>(
            segments: const [
              ButtonSegment(
                value: _ProjectVisibility.personal,
                label: Text('Personal'),
                icon: Icon(Icons.person_outline, size: 18),
              ),
              ButtonSegment(
                value: _ProjectVisibility.team,
                label: Text('Team'),
                icon: Icon(Icons.groups_outlined, size: 18),
              ),
              ButtonSegment(
                value: _ProjectVisibility.public,
                label: Text('Public'),
                icon: Icon(Icons.public_outlined, size: 18),
              ),
            ],
            selected: {_visibility},
            onSelectionChanged: (vis) {
              HapticFeedback.selectionClick();
              setState(() => _visibility = vis.first);
            },
          ),
          const SizedBox(height: 20),

          // Due date
          _SectionLabel(label: 'Due Date (Optional)'),
          const SizedBox(height: 8),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: isLight
                  ? BorderSide(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                    )
                  : BorderSide.none,
            ),
            child: ListTile(
              leading: Icon(
                Icons.event_rounded,
                color: _dueDate != null ? colorScheme.primary : null,
              ),
              title: Text(
                _dueDate != null
                    ? _formatDate(_dueDate!)
                    : 'No due date',
              ),
              trailing: _dueDate != null
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() => _dueDate = null),
                    )
                  : const Icon(Icons.chevron_right_rounded),
              onTap: () async {
                HapticFeedback.lightImpact();
                final date = await showDatePicker(
                  context: context,
                  initialDate: _dueDate ?? DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
                );
                if (date != null) {
                  setState(() => _dueDate = date);
                }
              },
            ),
          ),

          // Team members selector (shows only if team visibility)
          if (_visibility == _ProjectVisibility.team) ...[
            const SizedBox(height: 20),
            _SectionLabel(label: 'Team Members'),
            const SizedBox(height: 8),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: isLight
                    ? BorderSide(
                        color: colorScheme.primary.withValues(alpha: 0.1),
                      )
                    : BorderSide.none,
              ),
              child: ListTile(
                leading: const Icon(Icons.person_add_rounded),
                title: const Text('Add team members'),
                subtitle: Text(
                  'Select from your team',
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () {
                  HapticFeedback.lightImpact();
                  // Phase 4: Show team member picker
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Team member picker coming soon'),
                    ),
                  );
                },
              ),
            ),
          ],
          const SizedBox(height: 32),

          // Submit
          ElevatedButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    HapticFeedback.mediumImpact();
                    _submit();
                  },
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(widget.isEditing ? 'Save Changes' : 'Create Project'),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        color: colorScheme.onSurfaceVariant.withValues(
          alpha: isLight ? 0.6 : 0.5,
        ),
      ),
      filled: true,
      fillColor: isLight
          ? colorScheme.surfaceContainerHigh.withValues(alpha: 0.4)
          : colorScheme.surfaceContainer,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.all(14),
    );
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a project name')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    if (widget.isEditing) {
      final project =
          ref.read(projectByIdProvider(widget.projectId!)).valueOrNull;
      if (project != null) {
        final description = _descriptionController.text.trim();
        final updatedProject = project.copyWith(
          name: name,
          description: description.isEmpty ? null : description,
          color: _color,
          icon: _icon,
          updatedAt: DateTime.now(),
        );
        final updateProject = ref.read(updateProjectProvider);
        await updateProject(updatedProject);
        ref.invalidate(projectByIdProvider(widget.projectId!));
      }
    } else {
      final createProject = ref.read(createProjectProvider);
      await createProject(name: name, color: _color, icon: _icon);
    }

    ref.invalidate(projectListProvider);

    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  static String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Text(
      label,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurfaceVariant,
      ),
    );
  }
}

enum _DefaultView { list, kanban, timeline }
enum _ProjectVisibility { personal, team, public }
