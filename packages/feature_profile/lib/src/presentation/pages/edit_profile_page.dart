import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

import '../providers/profile_providers.dart';

/// Industry mode options.
enum IndustryMode { general, hustle, closer, grind }

/// L2 - Edit Profile page with name, avatar, timezone, industry mode, bio.
class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _bioController;
  IndustryMode _industryMode = IndustryMode.general;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider).valueOrNull;
    _nameController = TextEditingController(text: user?.name ?? '');
    _bioController = TextEditingController();
    _loadPersistedProfile();
  }

  Future<void> _loadPersistedProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('unjynx_profile_name');
    final savedBio = prefs.getString('unjynx_profile_bio');
    if (mounted) {
      setState(() {
        if (savedName != null && savedName.isNotEmpty) {
          _nameController.text = savedName;
        }
        if (savedBio != null) {
          _bioController.text = savedBio;
        }
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final user = ref.watch(currentUserProvider).valueOrNull;
    final timezone = ref.watch(timezoneProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        actions: [
          TextButton(
            onPressed: _hasChanges ? _saveProfile : null,
            child: Text(
              'Save',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: _hasChanges ? colorScheme.primary : ux.textDisabled,
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          // Avatar section
          _AvatarSection(
            avatarUrl: user?.avatarUrl,
            name: user?.name ?? '',
            onPickImage: _pickAvatar,
          ),
          const SizedBox(height: 24),

          // Display name
          _FormField(
            label: 'Display Name',
            controller: _nameController,
            onChanged: (_) => setState(() => _hasChanges = true),
          ),
          const SizedBox(height: 16),

          // Email (read-only)
          _ReadOnlyField(
            label: 'Email',
            value: user?.email ?? 'Not set',
            icon: Icons.email_outlined,
          ),
          const SizedBox(height: 16),

          // Timezone selector
          _TappableField(
            label: 'Timezone',
            value: timezone,
            icon: Icons.language_rounded,
            onTap: () => _showTimezonePicker(context, ref),
          ),
          const SizedBox(height: 16),

          // Industry mode
          _IndustryModeSelector(
            selected: _industryMode,
            onChanged: (mode) {
              setState(() {
                _industryMode = mode;
                _hasChanges = true;
              });
            },
          ),
          const SizedBox(height: 16),

          // Bio
          _FormField(
            label: 'Bio',
            controller: _bioController,
            maxLines: 3,
            hint: 'Tell us about yourself...',
            onChanged: (_) => setState(() => _hasChanges = true),
          ),
          const SizedBox(height: 32),

          // Danger zone
          _DangerZone(
            onExportData: _exportData,
            onDeleteAccount: () => _deleteAccount(context),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  void _pickAvatar() {
    final colorScheme = Theme.of(context).colorScheme;

    showModalBottomSheet<void>(
      context: context,
      barrierColor: const Color(0xFF1A0533).withValues(alpha: 0.20),
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(this.context).showSnackBar(
                  SnackBar(
                    content: const Text('Photo upload coming soon'),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(this.context).showSnackBar(
                  SnackBar(
                    content: const Text('Photo upload coming soon'),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.delete_outline, color: colorScheme.error),
              title: Text('Remove Photo', style: TextStyle(color: colorScheme.error)),
              onTap: () {
                Navigator.pop(context);
                setState(() => _hasChanges = true);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    HapticFeedback.mediumImpact();

    final name = _nameController.text.trim();
    final bio = _bioController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Name cannot be empty'),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      return;
    }

    try {
      // Persist to SharedPreferences as fallback storage.
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('unjynx_profile_name', name);
      await prefs.setString('unjynx_profile_bio', bio);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Profile saved successfully'),
            backgroundColor: context.unjynx.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
        setState(() => _hasChanges = false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save profile: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  void _exportData() {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Data export will be available in a future update.',
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  void _deleteAccount(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final controller = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Delete Account?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This action is permanent. All data will be lost.',
              style: TextStyle(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            Text(
              'Type DELETE to confirm:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: colorScheme.error,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              style: TextStyle(color: colorScheme.onSurface),
              decoration: InputDecoration(
                hintText: 'DELETE',
                hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (controller.text == 'DELETE') {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(this.context).showSnackBar(
                  SnackBar(
                    content: const Text(
                      'Account deletion will be available after launch. '
                      'Contact support@unjynx.me',
                    ),
                    behavior: SnackBarBehavior.floating,
                    duration: const Duration(seconds: 5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: colorScheme.error),
            child: const Text('Delete Forever'),
          ),
        ],
      ),
    );
  }

  void _showTimezonePicker(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final currentTz = ref.read(timezoneProvider);

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      barrierColor: const Color(0xFF1A0533).withValues(alpha: 0.20),
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _TimezonePicker(
        currentTimezone: currentTz,
        onSelected: (tz) {
          ref.read(timezoneProvider.notifier).setTimezone(tz);
          setState(() => _hasChanges = true);
          Navigator.of(context).pop();
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Avatar section
// ---------------------------------------------------------------------------

class _AvatarSection extends StatelessWidget {
  const _AvatarSection({
    required this.avatarUrl,
    required this.name,
    required this.onPickImage,
  });

  final String? avatarUrl;
  final String name;
  final VoidCallback onPickImage;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Center(
      child: GestureDetector(
        onTap: onPickImage,
        child: Stack(
          children: [
            CircleAvatar(
              radius: 52,
              backgroundColor: colorScheme.primary
                  .withValues(alpha: isLight ? 0.15 : 0.3),
              backgroundImage:
                  avatarUrl != null ? NetworkImage(avatarUrl!) : null,
              child: avatarUrl == null
                  ? Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'U',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: isLight ? ux.gold : ux.gold.withValues(alpha: 0.8),
                      ),
                    )
                  : null,
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: colorScheme.surface,
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.camera_alt_rounded,
                  size: 16,
                  color: colorScheme.onPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

class _FormField extends StatelessWidget {
  const _FormField({
    required this.label,
    required this.controller,
    this.maxLines = 1,
    this.hint,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final int maxLines;
  final String? hint;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: TextStyle(color: colorScheme.onSurface),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
            filled: true,
            fillColor: colorScheme.surfaceContainerHigh,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _ReadOnlyField extends StatelessWidget {
  const _ReadOnlyField({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHigh
                .withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
              const SizedBox(width: 10),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              Icon(
                Icons.lock_outline,
                size: 14,
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TappableField extends StatelessWidget {
  const _TappableField({
    required this.label,
    required this.value,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final String value;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                      fontSize: 14,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: colorScheme.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Industry mode selector
// ---------------------------------------------------------------------------

class _IndustryModeSelector extends StatelessWidget {
  const _IndustryModeSelector({
    required this.selected,
    required this.onChanged,
  });

  final IndustryMode selected;
  final ValueChanged<IndustryMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Industry Mode',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: SegmentedButton<IndustryMode>(
            segments: const [
              ButtonSegment(
                value: IndustryMode.general,
                label: Text('General'),
              ),
              ButtonSegment(
                value: IndustryMode.hustle,
                label: Text('Hustle'),
              ),
              ButtonSegment(
                value: IndustryMode.closer,
                label: Text('Closer'),
              ),
              ButtonSegment(
                value: IndustryMode.grind,
                label: Text('Grind'),
              ),
            ],
            selected: {selected},
            onSelectionChanged: (s) => onChanged(s.first),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Danger zone
// ---------------------------------------------------------------------------

class _DangerZone extends StatelessWidget {
  const _DangerZone({
    required this.onExportData,
    required this.onDeleteAccount,
  });

  final VoidCallback onExportData;
  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'DANGER ZONE',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: colorScheme.error,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        Card(
          color: colorScheme.error.withValues(alpha: isLight ? 0.04 : 0.06),
          child: Column(
            children: [
              ListTile(
                leading: Icon(
                  Icons.download_rounded,
                  color: colorScheme.onSurfaceVariant,
                ),
                title: const Text('Export Data'),
                subtitle: const Text('Download all your data as JSON'),
                trailing: Icon(
                  Icons.chevron_right,
                  color: colorScheme.onSurfaceVariant,
                ),
                onTap: onExportData,
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(
                  Icons.delete_forever_rounded,
                  color: colorScheme.error,
                ),
                title: Text(
                  'Delete Account',
                  style: TextStyle(color: colorScheme.error),
                ),
                subtitle: const Text('Permanently delete all data'),
                onTap: onDeleteAccount,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Timezone picker (reused from original profile_page)
// ---------------------------------------------------------------------------

const _timezones = <(String, String, String)>[
  ('Asia/Kolkata', 'India (IST)', '+05:30'),
  ('Asia/Dhaka', 'Bangladesh (BST)', '+06:00'),
  ('Asia/Karachi', 'Pakistan (PKT)', '+05:00'),
  ('Asia/Dubai', 'Dubai (GST)', '+04:00'),
  ('Asia/Singapore', 'Singapore (SGT)', '+08:00'),
  ('Asia/Tokyo', 'Japan (JST)', '+09:00'),
  ('Europe/London', 'London (GMT)', '+00:00'),
  ('Europe/Paris', 'Paris (CET)', '+01:00'),
  ('Europe/Berlin', 'Berlin (CET)', '+01:00'),
  ('America/New_York', 'New York (EST)', '-05:00'),
  ('America/Chicago', 'Chicago (CST)', '-06:00'),
  ('America/Los_Angeles', 'Los Angeles (PST)', '-08:00'),
  ('Australia/Sydney', 'Sydney (AEST)', '+10:00'),
  ('Pacific/Auckland', 'Auckland (NZST)', '+12:00'),
];

class _TimezonePicker extends StatefulWidget {
  const _TimezonePicker({
    required this.currentTimezone,
    required this.onSelected,
  });

  final String currentTimezone;
  final ValueChanged<String> onSelected;

  @override
  State<_TimezonePicker> createState() => _TimezonePickerState();
}

class _TimezonePickerState extends State<_TimezonePicker> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final filtered = _timezones.where((tz) {
      final q = _query.toLowerCase();
      return tz.$1.toLowerCase().contains(q) ||
          tz.$2.toLowerCase().contains(q);
    }).toList();

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.6,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Select Timezone',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchController,
              style: TextStyle(color: colorScheme.onSurface),
              decoration: InputDecoration(
                hintText: 'Search timezone...',
                hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
                prefixIcon: Icon(
                  Icons.search,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              onChanged: (value) => setState(() => _query = value),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final tz = filtered[index];
                  final isSelected = tz.$1 == widget.currentTimezone;
                  return ListTile(
                    title: Text(
                      tz.$2,
                      style: TextStyle(
                        color: isSelected
                            ? colorScheme.primary
                            : colorScheme.onSurface,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                    trailing: Text(
                      'UTC ${tz.$3}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isSelected
                            ? colorScheme.primary
                            : colorScheme.onSurfaceVariant,
                      ),
                    ),
                    selected: isSelected,
                    onTap: () => widget.onSelected(tz.$1),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
