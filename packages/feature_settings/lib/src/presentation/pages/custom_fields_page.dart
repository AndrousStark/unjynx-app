import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

final _fieldsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = _tryRead(ref, customFieldApiProvider);
  if (api == null) return const [];
  try {
    final r = await api.getFields();
    if (r.success && r.data != null) {
      return r.data!.cast<Map<String, dynamic>>();
    }
  } on DioException {
    // Swallow.
  }
  return const [];
});

// ---------------------------------------------------------------------------
// Field type metadata
// ---------------------------------------------------------------------------

const _fieldTypeIcons = <String, IconData>{
  'text': Icons.text_fields_rounded,
  'number': Icons.numbers_rounded,
  'date': Icons.calendar_today_rounded,
  'select': Icons.arrow_drop_down_circle_rounded,
  'multi_select': Icons.checklist_rounded,
  'checkbox': Icons.check_box_rounded,
  'user': Icons.person_rounded,
  'url': Icons.link_rounded,
  'email': Icons.email_rounded,
  'phone': Icons.phone_rounded,
  'rich_text': Icons.article_rounded,
  'label': Icons.label_rounded,
  'currency': Icons.attach_money_rounded,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/// Settings page for managing custom field definitions.
class CustomFieldsPage extends ConsumerStatefulWidget {
  const CustomFieldsPage({super.key});

  @override
  ConsumerState<CustomFieldsPage> createState() => _CustomFieldsPageState();
}

class _CustomFieldsPageState extends ConsumerState<CustomFieldsPage> {
  Future<void> _createField() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _CreateFieldSheet(ref: ref),
    );
    if (result == true) {
      ref.invalidate(_fieldsProvider);
    }
  }

  Future<void> _deleteField(String fieldId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete field?'),
        content: Text('Permanently remove "$name" and all its values?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Delete',
              style: TextStyle(color: Theme.of(ctx).colorScheme.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    HapticFeedback.heavyImpact();
    try {
      final api = ref.read(customFieldApiProvider);
      await api.archiveField(fieldId);
      ref.invalidate(_fieldsProvider);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('"$name" deleted')));
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to delete field')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final fieldsAsync = ref.watch(_fieldsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Custom Fields'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            tooltip: 'Add Field',
            onPressed: _createField,
          ),
        ],
      ),
      body: fieldsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) =>
            const Center(child: Text('Failed to load custom fields')),
        data: (fields) {
          if (fields.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.tune_rounded,
                    size: 56,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No custom fields yet',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add fields to track extra data on your tasks.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: _createField,
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Add Field'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_fieldsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: fields.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _FieldCard(
                field: fields[i],
                onDelete: () => _deleteField(
                  fields[i]['id'] as String,
                  fields[i]['name'] as String,
                ),
                colorScheme: colorScheme,
                theme: theme,
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Field card
// ---------------------------------------------------------------------------

class _FieldCard extends StatelessWidget {
  final Map<String, dynamic> field;
  final VoidCallback onDelete;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _FieldCard({
    required this.field,
    required this.onDelete,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final name = field['name'] as String? ?? '';
    final fieldType = field['fieldType'] as String? ?? 'text';
    final key = field['fieldKey'] as String? ?? '';
    final description = field['description'] as String?;
    final isRequired = field['isRequired'] as bool? ?? false;
    final icon = _fieldTypeIcons[fieldType] ?? Icons.text_fields_rounded;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: colorScheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: colorScheme.secondaryContainer.withValues(
                          alpha: 0.5,
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        fieldType.replaceAll('_', ' '),
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (isRequired) ...[
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Required',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.error,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  key,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  ),
                ),
                if (description != null && description.isNotEmpty)
                  Text(
                    description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              Icons.delete_outline_rounded,
              size: 20,
              color: colorScheme.error,
            ),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Create field bottom sheet
// ---------------------------------------------------------------------------

class _CreateFieldSheet extends StatefulWidget {
  final WidgetRef ref;

  const _CreateFieldSheet({required this.ref});

  @override
  State<_CreateFieldSheet> createState() => _CreateFieldSheetState();
}

class _CreateFieldSheetState extends State<_CreateFieldSheet> {
  final _nameController = TextEditingController();
  String _selectedType = 'text';
  bool _isRequired = false;
  bool _isCreating = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  String _autoKey(String name) {
    return name
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
        .replaceAll(RegExp(r'^_|_$'), '');
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _isCreating = true);
    HapticFeedback.mediumImpact();

    try {
      final api = widget.ref.read(customFieldApiProvider);
      final response = await api.createField(
        name: name,
        fieldKey: _autoKey(name),
        fieldType: _selectedType,
        isRequired: _isRequired,
      );

      if (!mounted) return;

      if (response.success) {
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.error ?? 'Failed to create field')),
        );
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.message}')));
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final key = _autoKey(_nameController.text);

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'New Custom Field',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // Name
          TextField(
            controller: _nameController,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              labelText: 'Field Name',
              hintText: 'e.g. Story Points',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (_) => setState(() {}),
          ),
          if (key.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              '  Key: $key',
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
                color: colorScheme.onSurfaceVariant,
                fontSize: 11,
              ),
            ),
          ],
          const SizedBox(height: 16),

          // Type selector
          Text(
            'Field Type',
            style: theme.textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 100,
            child: GridView.count(
              crossAxisCount: 4,
              childAspectRatio: 2.2,
              crossAxisSpacing: 6,
              mainAxisSpacing: 6,
              children: _fieldTypeIcons.entries.map((e) {
                final isSelected = _selectedType == e.key;
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _selectedType = e.key);
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colorScheme.primary.withValues(alpha: 0.1)
                          : colorScheme.surfaceContainerHighest.withValues(
                              alpha: 0.3,
                            ),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? colorScheme.primary
                            : colorScheme.outlineVariant.withValues(alpha: 0.3),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          e.value,
                          size: 14,
                          color: isSelected
                              ? colorScheme.primary
                              : colorScheme.onSurfaceVariant,
                        ),
                        Text(
                          e.key.replaceAll('_', ' '),
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontSize: 8,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // Required toggle
          SwitchListTile(
            title: const Text('Required'),
            value: _isRequired,
            onChanged: (v) => setState(() => _isRequired = v),
            dense: true,
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 12),

          // Submit
          FilledButton(
            onPressed: _isCreating ? null : _submit,
            child: _isCreating
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Create Field'),
          ),
        ],
      ),
    );
  }
}
