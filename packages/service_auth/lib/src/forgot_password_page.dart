import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import 'forgot_password_providers.dart';

/// Forgot-password screen (A3) — sends a password-reset link via email.
///
/// Matches the LoginPage gradient, fade transition, and button styling.
/// On success the form is replaced with a confirmation view.
class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() =>
      _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();

    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSendResetLink() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final email = _emailController.text.trim();
    await ref.read(forgotPasswordNotifierProvider.notifier).sendResetLink(email);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final state = ref.watch(forgotPasswordNotifierProvider);

    // Show error via SnackBar when the provider enters an error state.
    ref.listen<AsyncValue<bool>>(forgotPasswordNotifierProvider, (prev, next) {
      if (next is AsyncError) {
        final error = next.error;
        final message = error is FormatException
            ? error.message
            : 'Something went wrong. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: colorScheme.error,
          ),
        );
      }
    });

    final isLoading = state is AsyncLoading;
    final isSuccess = state is AsyncData<bool> && state.value == true;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: isSuccess
                ? _SuccessView(ux: ux, colorScheme: colorScheme, isLight: isLight)
                : _FormView(
                    formKey: _formKey,
                    emailController: _emailController,
                    isLoading: isLoading,
                    onSubmit: _handleSendResetLink,
                    ux: ux,
                    colorScheme: colorScheme,
                    isLight: isLight,
                  ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Form view — email input + CTA
// =============================================================================

class _FormView extends StatelessWidget {
  const _FormView({
    required this.formKey,
    required this.emailController,
    required this.isLoading,
    required this.onSubmit,
    required this.ux,
    required this.colorScheme,
    required this.isLight,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final bool isLoading;
  final VoidCallback onSubmit;
  final UnjynxCustomColors ux;
  final ColorScheme colorScheme;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          // Back button row
          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: IconButton(
                onPressed: () => context.pop(),
                icon: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: colorScheme.onSurface,
                  size: 22,
                ),
                style: IconButton.styleFrom(
                  backgroundColor: isLight
                      ? const Color(0xFF1A0533).withValues(alpha: 0.05)
                      : Colors.white.withValues(alpha: 0.08),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),

          const Spacer(flex: 2),

          // Lock icon (same container pattern as LoginPage brand section)
          _LockIconSection(ux: ux, colorScheme: colorScheme, isLight: isLight),

          const SizedBox(height: 32),

          // Title
          Text(
            'Reset Password',
            style: TextStyle(
              fontSize: 28,
              fontWeight: isLight ? FontWeight.w800 : FontWeight.w900,
              color: colorScheme.onSurface,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),

          // Subtitle
          Text(
            "Enter your email and we'll send a reset link",
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w400,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.7 : 0.6),
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 40),

          // Email input
          Form(
            key: formKey,
            child: TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => onSubmit(),
              style: TextStyle(
                fontSize: 16,
                color: colorScheme.onSurface,
              ),
              decoration: InputDecoration(
                hintText: 'Email address',
                hintStyle: TextStyle(
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.5 : 0.4),
                ),
                prefixIcon: Icon(
                  Icons.email_outlined,
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.6 : 0.5),
                  size: 22,
                ),
                filled: true,
                fillColor: isLight
                    ? Colors.white
                    : Colors.white.withValues(alpha: 0.06),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isLight
                        ? const Color(0xFF1A0533).withValues(alpha: 0.1)
                        : Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isLight
                        ? const Color(0xFF1A0533).withValues(alpha: 0.1)
                        : Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: ux.gold,
                    width: 1.5,
                  ),
                ),
                errorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: colorScheme.error,
                  ),
                ),
                focusedErrorBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: colorScheme.error,
                    width: 1.5,
                  ),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter your email address';
                }
                final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                if (!emailRegex.hasMatch(value.trim())) {
                  return 'Please enter a valid email address';
                }
                return null;
              },
            ),
          ),

          const SizedBox(height: 24),

          // Gold CTA button — matches LoginPage button styling
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: ux.gold,
                foregroundColor: Colors.white,
                disabledBackgroundColor: ux.gold.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Send Reset Link',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),

          const Spacer(flex: 3),
        ],
      ),
    );
  }
}

// =============================================================================
// Lock icon section — styled container matching LoginPage brand section
// =============================================================================

class _LockIconSection extends StatelessWidget {
  const _LockIconSection({
    required this.ux,
    required this.colorScheme,
    required this.isLight,
  });

  final UnjynxCustomColors ux;
  final ColorScheme colorScheme;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: isLight ? ux.goldWash : ux.gold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: ux.gold.withValues(alpha: isLight ? 0.2 : 0.3),
        ),
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: ux.gold.withValues(alpha: 0.15),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Icon(
        Icons.lock_outline_rounded,
        size: 44,
        color: ux.gold,
      ),
    );
  }
}

// =============================================================================
// Success view — confirmation after email sent
// =============================================================================

class _SuccessView extends StatelessWidget {
  const _SuccessView({
    required this.ux,
    required this.colorScheme,
    required this.isLight,
  });

  final UnjynxCustomColors ux;
  final ColorScheme colorScheme;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          const Spacer(flex: 3),

          // Checkmark icon in styled container
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: isLight
                  ? ux.successWash
                  : ux.success.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: ux.success.withValues(alpha: isLight ? 0.2 : 0.3),
              ),
              boxShadow: isLight
                  ? [
                      BoxShadow(
                        // Purple-tinted shadow on light mode
                        color: const Color(0xFF1A0533).withValues(alpha: 0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              Icons.check_rounded,
              size: 52,
              color: ux.success,
            ),
          ),

          const SizedBox(height: 32),

          Text(
            'Check your email',
            style: TextStyle(
              fontSize: 28,
              fontWeight: isLight ? FontWeight.w800 : FontWeight.w900,
              color: colorScheme.onSurface,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),

          Text(
            "We've sent a password reset link to your email. "
            'Check your inbox and follow the instructions.',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w400,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.7 : 0.6),
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 40),

          // Back to Login — gold CTA
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () => context.go('/login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: ux.gold,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Back to Login',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          const Spacer(flex: 4),
        ],
      ),
    );
  }
}
