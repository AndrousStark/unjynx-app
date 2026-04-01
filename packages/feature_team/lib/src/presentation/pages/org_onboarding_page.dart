import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';
import 'package:service_auth/service_auth.dart';

/// Post-login onboarding page: "What does your team do?"
///
/// Shows 11 industry mode cards. User selects one (or skips).
/// Selection updates the org's industryMode via API.
/// Marks onboarding as complete in secure storage.
class OrgOnboardingPage extends ConsumerStatefulWidget {
  const OrgOnboardingPage({super.key});

  @override
  ConsumerState<OrgOnboardingPage> createState() => _OrgOnboardingPageState();
}

class _OrgOnboardingPageState extends ConsumerState<OrgOnboardingPage> {
  String? _selectedMode;
  bool _saving = false;

  static const _modes = [
    _Mode(
      'legal',
      'Legal',
      Icons.balance_rounded,
      Color(0xFF1E3A5F),
      'Cases, deadlines, billing',
    ),
    _Mode(
      'healthcare',
      'Healthcare',
      Icons.health_and_safety_rounded,
      Color(0xFF0D7377),
      'Appointments, follow-ups',
    ),
    _Mode(
      'dev_teams',
      'Dev Teams',
      Icons.code_rounded,
      Color(0xFF7C3AED),
      'Sprints, issues, deploys',
    ),
    _Mode(
      'construction',
      'Construction',
      Icons.construction_rounded,
      Color(0xFFC2410C),
      'Job sites, inspections',
    ),
    _Mode(
      'real_estate',
      'Real Estate',
      Icons.home_work_rounded,
      Color(0xFF0891B2),
      'Listings, transactions',
    ),
    _Mode(
      'education',
      'Education',
      Icons.school_rounded,
      Color(0xFF2563EB),
      'Courses, assignments',
    ),
    _Mode(
      'finance',
      'Finance',
      Icons.account_balance_rounded,
      Color(0xFF047857),
      'Audits, portfolios',
    ),
    _Mode(
      'hr',
      'HR',
      Icons.groups_rounded,
      Color(0xFFDB2777),
      'Hiring, onboarding',
    ),
    _Mode(
      'marketing',
      'Marketing',
      Icons.campaign_rounded,
      Color(0xFFE11D48),
      'Campaigns, content',
    ),
    _Mode(
      'family',
      'Family',
      Icons.family_restroom_rounded,
      Color(0xFF8B5CF6),
      'Chores, events',
    ),
    _Mode(
      'students',
      'Students',
      Icons.menu_book_rounded,
      Color(0xFF4F46E5),
      'Homework, exams',
    ),
  ];

  Future<void> _finish() async {
    setState(() => _saving = true);
    HapticFeedback.mediumImpact();

    try {
      // If a mode is selected and the user is in an org, update the org's industry mode.
      final orgId = ref.read(selectedOrgIdProvider);
      if (_selectedMode != null && orgId != null) {
        final orgApi = ref.read(organizationApiProvider);
        await orgApi.updateOrganization(orgId, industryMode: _selectedMode);
      }

      // Mark onboarding as complete — GoRouter redirect guard will push to home.
      await markOnboardingComplete(ref);
    } catch (_) {
      // Non-blocking: let the user continue even if the API call fails.
      // Onboarding must still be marked complete so they don't loop.
      try {
        await markOnboardingComplete(ref);
      } catch (_) {
        // Best-effort.
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Rocket icon
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    colors: [colorScheme.primary, colorScheme.tertiary],
                  ),
                ),
                child: const Icon(
                  Icons.rocket_launch_rounded,
                  size: 36,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),

              // Title
              Text(
                'What does your team do?',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'This customizes your vocabulary, templates, and dashboard.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Mode Grid
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 2.2,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: _modes.length,
                  itemBuilder: (context, i) {
                    final mode = _modes[i];
                    final isSelected = _selectedMode == mode.slug;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedMode = isSelected ? null : mode.slug;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected
                                ? colorScheme.primary
                                : colorScheme.outlineVariant.withValues(
                                    alpha: 0.5,
                                  ),
                            width: isSelected ? 2 : 1,
                          ),
                          color: isSelected
                              ? colorScheme.primary.withValues(alpha: 0.05)
                              : colorScheme.surfaceContainerHighest.withValues(
                                  alpha: 0.3,
                                ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                color: mode.color.withValues(alpha: 0.12),
                              ),
                              child: Icon(
                                mode.icon,
                                size: 18,
                                color: mode.color,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    mode.name,
                                    style: theme.textTheme.labelLarge?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    mode.description,
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: colorScheme.onSurfaceVariant,
                                      fontSize: 9,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_circle_rounded,
                                size: 18,
                                color: colorScheme.primary,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 16),

              // Continue button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: _saving ? null : _finish,
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          _selectedMode != null
                              ? 'Apply & Continue'
                              : 'Continue as General',
                        ),
                ),
              ),

              const SizedBox(height: 8),

              // Skip
              TextButton(
                onPressed: _saving ? null : _finish,
                child: Text(
                  'Skip for now',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _Mode {
  final String slug;
  final String name;
  final IconData icon;
  final Color color;
  final String description;

  const _Mode(this.slug, this.name, this.icon, this.color, this.description);
}
