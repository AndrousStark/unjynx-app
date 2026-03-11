import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import 'color_picker.dart';
import 'icon_picker.dart';

/// Bottom sheet for editing an existing project.
class EditProjectSheet extends ConsumerStatefulWidget {
  const EditProjectSheet({required this.project, super.key});

  final Project project;

  @override
  ConsumerState<EditProjectSheet> createState() => _EditProjectSheetState();
}

class _EditProjectSheetState extends ConsumerState<EditProjectSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late String _color;
  late String _icon;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.project.name);
    _descriptionController = TextEditingController(
      text: widget.project.description ?? '',
    );
    _color = widget.project.color;
    _icon = widget.project.icon;
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
    final isLight = context.isLightMode;

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.onSurfaceVariant.withValues(
                    alpha: isLight ? 0.3 : 0.2,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Text(
              'Edit Project',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 20),

            // Name
            TextField(
              controller: _nameController,
              autofocus: true,
              style: TextStyle(color: colorScheme.onSurface),
              decoration: InputDecoration(
                hintText: 'Project name',
                hintStyle: TextStyle(
                  color: colorScheme.onSurfaceVariant.withValues(
                    alpha: isLight ? 0.7 : 0.6,
                  ),
                ),
              ),
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 16),

            // Description
            TextField(
              controller: _descriptionController,
              style: TextStyle(color: colorScheme.onSurface),
              decoration: InputDecoration(
                hintText: 'Description (optional)',
                hintStyle: TextStyle(
                  color: colorScheme.onSurfaceVariant.withValues(
                    alpha: isLight ? 0.7 : 0.6,
                  ),
                ),
              ),
              maxLines: 3,
              minLines: 1,
            ),
            const SizedBox(height: 24),

            // Color picker
            Text(
              'Color',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            ColorPicker(
              selectedColor: _color,
              onColorSelected: (color) {
                HapticFeedback.selectionClick();
                setState(() => _color = color);
              },
            ),
            const SizedBox(height: 24),

            // Icon picker
            Text(
              'Icon',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            IconPicker(
              selectedIcon: _icon,
              onIconSelected: (icon) {
                HapticFeedback.selectionClick();
                setState(() => _icon = icon);
              },
            ),
            const SizedBox(height: 24),

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
                  : const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _isSubmitting = true);

    final description = _descriptionController.text.trim();
    final updatedProject = widget.project.copyWith(
      name: name,
      description: description.isEmpty ? null : description,
      color: _color,
      icon: _icon,
      updatedAt: DateTime.now(),
    );

    final updateProject = ref.read(updateProjectProvider);
    await updateProject(updatedProject);

    ref.invalidate(projectListProvider);
    ref.invalidate(projectByIdProvider(widget.project.id));

    if (mounted) {
      Navigator.of(context).pop();
    }
  }
}
