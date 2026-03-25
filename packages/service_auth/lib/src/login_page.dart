import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import 'auth_providers.dart';
import 'google_sign_in_helper.dart';
import 'mock_auth_port.dart';

/// Login screen (A2) - Logto OIDC sign-in flow.
///
/// Displays the UNJYNX branding with social login options.
/// With MockAuthPort: immediately authenticates.
/// With LogtoAuthPort: opens Logto OIDC browser flow.
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({this.redirectTo, super.key});

  /// Where to redirect after successful login.
  final String? redirectTo;

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;
  bool _isSigningIn = false;
  String? _activeProvider;
  bool _showEmailForm = false;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
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
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleEmailSignIn() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = ref.read(authPortProvider);
    if (auth is MockAuthPort) {
      auth.setCredentials(email: _emailController.text.trim());
    }
    await _handleSignIn(provider: 'email');
  }

  Future<void> _handleSignIn({String? provider}) async {
    if (_isSigningIn) return;
    setState(() {
      _isSigningIn = true;
      _activeProvider = provider;
    });

    try {
      if (provider == 'google') {
        await _handleGoogleSignIn();
      } else {
        await ref.read(authNotifierProvider.notifier).signIn();
      }
      if (mounted) {
        context.go(widget.redirectTo ?? '/');
      }
    } on Exception catch (e) {
      if (mounted) {
        final colorScheme = Theme.of(context).colorScheme;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sign in failed: $e'),
            backgroundColor: colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSigningIn = false;
          _activeProvider = null;
        });
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    // Get the Google Web Client ID from compile-time env or fallback.
    const webClientId = String.fromEnvironment(
      'GOOGLE_WEB_CLIENT_ID',
      defaultValue:
          '763197051286-if56o7s0d7g7k9vt7r26dh6ehfgp3kc1.apps.googleusercontent.com',
    );

    final idToken = await GoogleSignInHelper.getIdToken(
      webClientId: webClientId,
    );

    if (idToken == null) {
      throw Exception('Google sign-in was cancelled');
    }

    // Route through AuthNotifier so isAuthenticatedProvider and
    // currentUserProvider are invalidated after sign-in completes.
    await ref.read(authNotifierProvider.notifier).signInWithSocial(
          provider: 'google',
          idToken: idToken,
        );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            // Light: white to lavender (editorial paper feel)
            // Dark: deep purple to midnight (immersive depth)
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  const Spacer(flex: 2),

                  // Logo + branding
                  _BrandSection(),

                  const Spacer(flex: 2),

                  // Sign in buttons
                  _SignInButton(
                    label: 'Continue with Google',
                    icon: Icons.g_mobiledata,
                    // Light: needs border since white-on-lavender is low contrast
                    color: Colors.white,
                    textColor: Colors.black87,
                    borderColor: isLight
                        ? const Color(0xFF1A0533).withValues(alpha: 0.1)
                        : null,
                    onTap: () => _handleSignIn(provider: 'google'),
                    isLoading: _isSigningIn && _activeProvider == 'google',
                  ),

                  const SizedBox(height: 12),

                  _SignInButton(
                    label: 'Continue with Apple',
                    icon: Icons.apple,
                    color: isLight ? const Color(0xFF1A0533) : Colors.white,
                    textColor: isLight ? Colors.white : Colors.black87,
                    onTap: () => _handleSignIn(provider: 'apple'),
                    isLoading: _isSigningIn && _activeProvider == 'apple',
                  ),

                  const SizedBox(height: 12),

                  if (!_showEmailForm) ...[
                    _SignInButton(
                      label: 'Continue with Email',
                      icon: Icons.email_outlined,
                      color: colorScheme.primary,
                      textColor: Colors.white,
                      onTap: () => setState(() => _showEmailForm = true),
                      isLoading: false,
                    ),
                  ] else ...[
                    Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: 'Email',
                              prefixIcon: const Icon(Icons.email_outlined),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              filled: true,
                              fillColor: colorScheme.surfaceContainerLow,
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Email is required';
                              if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: const Icon(Icons.lock_outline),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              filled: true,
                              fillColor: colorScheme.surfaceContainerLow,
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Password is required';
                              if (v.length < 6) return 'At least 6 characters';
                              return null;
                            },
                            onFieldSubmitted: (_) => _handleEmailSignIn(),
                          ),
                          const SizedBox(height: 16),
                          _SignInButton(
                            label: 'Sign In',
                            icon: Icons.login,
                            color: colorScheme.primary,
                            textColor: Colors.white,
                            onTap: _handleEmailSignIn,
                            isLoading: _isSigningIn && _activeProvider == 'email',
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => setState(() => _showEmailForm = false),
                            child: Text(
                              'Back to sign-in options',
                              style: TextStyle(fontSize: 14, color: colorScheme.onSurfaceVariant),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),

                  if (!_showEmailForm) ...[
                    // Forgot password
                    TextButton(
                      onPressed: () => context.push('/forgot-password'),
                      child: Text(
                        'Forgot password?',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: colorScheme.primary
                              .withValues(alpha: isLight ? 0.8 : 0.7),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 8),

                  // Skip for now (dev mode)
                  TextButton(
                    onPressed: _isSigningIn
                        ? null
                        : () async {
                            await ref
                                .read(authNotifierProvider.notifier)
                                .signIn();
                            if (mounted) {
                              context.go(widget.redirectTo ?? '/');
                            }
                          },
                    child: Text(
                      'Skip for now',
                      style: TextStyle(
                        fontSize: 14,
                        // Light needs higher opacity for readability
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.65 : 0.5),
                      ),
                    ),
                  ),

                  const Spacer(),

                  // Terms
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      'By continuing, you agree to our\n'
                      'Terms of Service and Privacy Policy',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.55 : 0.4),
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Brand section
// =============================================================================

class _BrandSection extends StatelessWidget {
  const _BrandSection();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Column(
      children: [
        // App icon — gold wash bg, adapts to mode
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            // Light: warm gold wash (visible on lavender gradient)
            // Dark: subtle gold tint (visible on deep purple gradient)
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
            Icons.bolt_rounded,
            size: 44,
            color: ux.gold,
          ),
        ),
        const SizedBox(height: 24),

        Text(
          'UNJYNX',
          style: TextStyle(
            fontSize: 36,
            fontWeight: isLight ? FontWeight.w800 : FontWeight.w900,
            color: colorScheme.onSurface,
            letterSpacing: 4,
          ),
        ),
        const SizedBox(height: 8),

        Text(
          'Break the satisfactory.',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            // Light: full opacity gold (already deepened #B8860B)
            // Dark: 70% opacity electric gold (#FFD700 is bright enough)
            color: isLight ? ux.gold : ux.gold.withValues(alpha: 0.7),
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// Sign in button
// =============================================================================

class _SignInButton extends StatelessWidget {
  const _SignInButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.textColor,
    required this.onTap,
    required this.isLoading,
    this.borderColor,
  });

  final String label;
  final IconData icon;
  final Color color;
  final Color textColor;
  final VoidCallback onTap;
  final bool isLoading;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: isLoading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: textColor,
          disabledBackgroundColor: color.withValues(alpha: 0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: borderColor != null
                ? BorderSide(color: borderColor!)
                : BorderSide.none,
          ),
          elevation: 0,
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: textColor,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 22),
                  const SizedBox(width: 10),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
