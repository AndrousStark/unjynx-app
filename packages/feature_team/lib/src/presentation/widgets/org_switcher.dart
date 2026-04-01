import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_auth/service_auth.dart';

import '../providers/team_providers.dart';

/// Compact org switcher widget for the app shell.
///
/// Shows current org name + avatar. Tapping opens a bottom sheet
/// with all user orgs to switch between them.
class OrgSwitcher extends ConsumerWidget {
  const OrgSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final selectedOrgId = ref.watch(selectedOrgIdProvider);
    final orgsAsync = ref.watch(organizationsProvider);

    // Resolve current org name + plan from the loaded list.
    final currentOrg = orgsAsync.whenData((orgs) {
      if (selectedOrgId == null) return null;
      try {
        return orgs.firstWhere((o) => o.id == selectedOrgId);
      } catch (_) {
        return null;
      }
    });

    final orgName = currentOrg.value?.name ?? 'Personal';
    final orgPlan = currentOrg.value?.planLabel ?? 'Free plan';
    final orgInitial = currentOrg.value?.name[0].toUpperCase() ?? 'P';
    final isPersonal = selectedOrgId == null;

    return GestureDetector(
      onTap: () => _showOrgPicker(context, ref),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            // Org avatar
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [colorScheme.primary, colorScheme.tertiary],
                ),
              ),
              child: Center(
                child: isPersonal
                    ? const Icon(
                        Icons.person_rounded,
                        size: 16,
                        color: Colors.white,
                      )
                    : Text(
                        orgInitial,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 10),
            // Org name + plan
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    orgName,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    orgPlan,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            // Chevron
            Icon(
              Icons.unfold_more_rounded,
              size: 18,
              color: colorScheme.onSurfaceVariant,
            ),
          ],
        ),
      ),
    );
  }

  void _showOrgPicker(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final selectedOrgId = ref.read(selectedOrgIdProvider);
    final orgs = ref.read(organizationsProvider).value ?? [];

    showModalBottomSheet(
      context: context,
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Switch Workspace',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Personal workspace (always available)
              _OrgListItem(
                name: 'Personal',
                plan: 'Free',
                isPersonal: true,
                isSelected: selectedOrgId == null,
                onTap: () {
                  HapticFeedback.selectionClick();
                  switchOrganization(ref, null);
                  Navigator.pop(sheetContext);
                },
              ),

              const SizedBox(height: 8),

              // User's organizations
              for (final org in orgs) ...[
                _OrgListItem(
                  name: org.name,
                  plan: org.planLabel,
                  isPersonal: false,
                  isSelected: selectedOrgId == org.id,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    switchOrganization(ref, org.id);
                    Navigator.pop(sheetContext);
                  },
                ),
                const SizedBox(height: 4),
              ],

              const Divider(height: 24),

              // Create org button
              ListTile(
                onTap: () {
                  Navigator.pop(sheetContext);
                  GoRouter.of(context).push('/org-onboarding');
                },
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: colorScheme.outlineVariant,
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Icon(
                    Icons.add_rounded,
                    size: 18,
                    color: colorScheme.primary,
                  ),
                ),
                title: Text(
                  'Create Organization',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                contentPadding: EdgeInsets.zero,
                dense: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Single org item in the bottom sheet picker.
class _OrgListItem extends StatelessWidget {
  final String name;
  final String plan;
  final bool isPersonal;
  final bool isSelected;
  final VoidCallback onTap;

  const _OrgListItem({
    required this.name,
    required this.plan,
    required this.isPersonal,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          gradient: LinearGradient(
            colors: [colorScheme.primary, colorScheme.tertiary],
          ),
        ),
        child: Center(
          child: isPersonal
              ? const Icon(Icons.person_rounded, size: 18, color: Colors.white)
              : Text(
                  name[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
      title: Text(
        name,
        style: theme.textTheme.bodyMedium?.copyWith(
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
      subtitle: Text(
        plan,
        style: theme.textTheme.labelSmall?.copyWith(
          color: colorScheme.onSurfaceVariant,
          fontSize: 10,
        ),
      ),
      trailing: isSelected
          ? Icon(
              Icons.check_circle_rounded,
              size: 20,
              color: colorScheme.primary,
            )
          : null,
      contentPadding: EdgeInsets.zero,
      dense: true,
    );
  }
}
