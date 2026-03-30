import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import 'auth_providers.dart';
import 'google_sign_in_helper.dart';
import 'mock_auth_port.dart';

/// Login screen (A2) — premium OIDC sign-in flow.
///
/// Supports Google Sign-In (native) and email/password via Logto OIDC.
/// Registration is handled via the backend's `/auth/register` endpoint.
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({this.redirectTo, super.key});

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
  _AuthMode _authMode = _AuthMode.buttons;
  bool _obscurePassword = true;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
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
    _nameController.dispose();
    super.dispose();
  }

  // ── Email Sign-In (opens Logto OIDC with login_hint) ──────────────

  Future<void> _handleEmailSignIn() async {
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.lightImpact();
      return;
    }
    HapticFeedback.mediumImpact();

    final auth = ref.read(authPortProvider);
    if (auth is MockAuthPort) {
      auth.setCredentials(email: _emailController.text.trim());
    }
    await _handleSignIn(provider: 'email');
  }

  // ── Registration via backend Management API ───────────────────────

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.lightImpact();
      return;
    }
    if (_isSigningIn) return;
    HapticFeedback.mediumImpact();

    setState(() {
      _isSigningIn = true;
      _activeProvider = 'register';
    });

    try {
      final auth = ref.read(authPortProvider);
      if (auth is MockAuthPort) {
        auth.setCredentials(email: _emailController.text.trim());
        await ref.read(authNotifierProvider.notifier).signIn();
      } else {
        // Register via backend API, then sign in via Logto OIDC
        await _callRegisterApi();
        await ref.read(authNotifierProvider.notifier).signIn();
      }
      if (mounted) {
        HapticFeedback.heavyImpact();
        context.go(widget.redirectTo ?? '/');
      }
    } on Exception catch (e) {
      if (mounted) {
        _showErrorSnackBar(_mapAuthError(e));
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

  Future<void> _callRegisterApi() async {
    // Use Dio directly to hit the register endpoint
    final dio = Dio()
      ..options.baseUrl = const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'https://api.unjynx.me',
      );

    final response = await dio.post<Map<String, dynamic>>(
      '/api/v1/auth/register',
      data: {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'name': _nameController.text.trim(),
      },
    );

    final data = response.data as Map<String, dynamic>;
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Registration failed');
    }
  }

  // ── Social Sign-In ────────────────────────────────────────────────

  Future<void> _handleSignIn({String? provider}) async {
    if (_isSigningIn) return;
    setState(() {
      _isSigningIn = true;
      _activeProvider = provider;
    });

    try {
      if (provider == 'google') {
        HapticFeedback.mediumImpact();
        await _handleGoogleSignIn();
      } else {
        await ref.read(authNotifierProvider.notifier).signIn();
      }
      if (mounted) {
        HapticFeedback.heavyImpact();
        context.go(widget.redirectTo ?? '/');
      }
    } on Exception catch (e) {
      final message = _mapAuthError(e);
      if (mounted && message.isNotEmpty) {
        _showErrorSnackBar(message);
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
    const webClientId = String.fromEnvironment(
      'GOOGLE_WEB_CLIENT_ID',
      defaultValue:
          '763197051286-if56o7s0d7g7k9vt7r26dh6ehfgp3kc1.apps.googleusercontent.com',
    );

    final idToken = await GoogleSignInHelper.getIdToken(
      webClientId: webClientId,
    );

    if (idToken == null) {
      throw Exception('cancelled');
    }

    await ref.read(authNotifierProvider.notifier).signInWithSocial(
          provider: 'google',
          idToken: idToken,
        );
  }

  // ── Error Mapping ─────────────────────────────────────────────────

  String _mapAuthError(Exception e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('cancelled') || msg.contains('canceled')) return '';
    if (msg.contains('network') || msg.contains('socket') || msg.contains('connection')) {
      return 'No internet connection. Check your network.';
    }
    if (msg.contains('already exists')) {
      return 'An account with this email already exists. Try signing in.';
    }
    if (msg.contains('401') || msg.contains('unauthorized')) {
      return 'Incorrect email or password.';
    }
    if (msg.contains('429') || msg.contains('rate') || msg.contains('too many')) {
      return 'Too many attempts. Try again in a minute.';
    }
    if (msg.contains('invalid') && msg.contains('password')) {
      return 'Password must be at least 8 characters.';
    }
    return 'Sign in failed. Please try again.';
  }

  void _showErrorSnackBar(String message) {
    final colorScheme = Theme.of(context).colorScheme;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: colorScheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────

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
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      const Spacer(flex: 2),
                      const _BrandSection(),
                      const Spacer(flex: 2),

                      // Auth content — animated transition
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        switchInCurve: Curves.easeOut,
                        switchOutCurve: Curves.easeIn,
                        child: _authMode == _AuthMode.buttons
                            ? _buildSocialButtons(colorScheme, ux, isLight)
                            : _authMode == _AuthMode.login
                                ? _buildEmailForm(colorScheme, ux, isLight, isRegister: false)
                                : _buildEmailForm(colorScheme, ux, isLight, isRegister: true),
                      ),

                      const SizedBox(height: 16),

                      // Forgot password (visible in button mode and login mode)
                      if (_authMode != _AuthMode.register)
                        TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          child: Text(
                            'Forgot password?',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: colorScheme.primary.withValues(alpha: isLight ? 0.8 : 0.7),
                            ),
                          ),
                        ),

                      const SizedBox(height: 8),

                      // Terms
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          'By continuing, you agree to our\n'
                          'Terms of Service and Privacy Policy',
                          style: TextStyle(
                            fontSize: 12,
                            color: colorScheme.onSurfaceVariant.withValues(alpha: isLight ? 0.55 : 0.4),
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),

                      const Spacer(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Social Buttons View ───────────────────────────────────────────

  Widget _buildSocialButtons(ColorScheme colorScheme, UnjynxCustomColors ux, bool isLight) {
    return Column(
      key: const ValueKey('social-buttons'),
      mainAxisSize: MainAxisSize.min,
      children: [
        _SignInButton(
          label: 'Continue with Google',
          icon: Icons.g_mobiledata,
          color: Colors.white,
          textColor: Colors.black87,
          borderColor: isLight ? const Color(0xFF1A0533).withValues(alpha: 0.1) : null,
          onTap: () => _handleSignIn(provider: 'google'),
          isLoading: _isSigningIn && _activeProvider == 'google',
        ),
        const SizedBox(height: 12),

        // Divider
        Row(
          children: [
            Expanded(child: Divider(color: colorScheme.outlineVariant.withValues(alpha: 0.3))),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'or',
                style: TextStyle(
                  fontSize: 14,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                ),
              ),
            ),
            Expanded(child: Divider(color: colorScheme.outlineVariant.withValues(alpha: 0.3))),
          ],
        ),
        const SizedBox(height: 12),

        _SignInButton(
          label: 'Sign in with Email',
          icon: Icons.email_outlined,
          color: colorScheme.primary,
          textColor: Colors.white,
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _authMode = _AuthMode.login);
          },
          isLoading: false,
        ),
        const SizedBox(height: 12),

        // New user? Register
        TextButton(
          onPressed: () {
            HapticFeedback.selectionClick();
            setState(() => _authMode = _AuthMode.register);
          },
          child: Text.rich(
            TextSpan(
              text: 'New here? ',
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
              ),
              children: [
                TextSpan(
                  text: 'Create account',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: ux.gold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ── Email Form View (Login or Register) ───────────────────────────

  Widget _buildEmailForm(
    ColorScheme colorScheme,
    UnjynxCustomColors ux,
    bool isLight, {
    required bool isRegister,
  }) {
    return Form(
      key: ValueKey(isRegister ? 'register-form' : 'login-form'),
      child: AutofillGroup(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Form(
              key: _formKey,
              child: Column(
                children: [
                  // Name field (register only)
                  if (isRegister) ...[
                    TextFormField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      autofillHints: const [AutofillHints.name],
                      textInputAction: TextInputAction.next,
                      decoration: _inputDecoration(
                        hint: 'Full name',
                        icon: Icons.person_outline,
                        colorScheme: colorScheme,
                        ux: ux,
                        isLight: isLight,
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Name is required';
                        if (v.trim().length < 2) return 'At least 2 characters';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Email field
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    textInputAction: TextInputAction.next,
                    decoration: _inputDecoration(
                      hint: 'Email address',
                      icon: Icons.email_outlined,
                      colorScheme: colorScheme,
                      ux: ux,
                      isLight: isLight,
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Email is required';
                      if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),

                  // Password field with visibility toggle
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    autofillHints: isRegister
                        ? const [AutofillHints.newPassword]
                        : const [AutofillHints.password],
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) =>
                        isRegister ? _handleRegister() : _handleEmailSignIn(),
                    decoration: _inputDecoration(
                      hint: isRegister ? 'Create password (8+ chars)' : 'Password',
                      icon: Icons.lock_outline,
                      colorScheme: colorScheme,
                      ux: ux,
                      isLight: isLight,
                      suffixIcon: IconButton(
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          size: 20,
                          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Password is required';
                      if (v.length < 8) return 'At least 8 characters';
                      return null;
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Submit button
            _SignInButton(
              label: isRegister ? 'Create Account' : 'Sign In',
              icon: isRegister ? Icons.person_add_outlined : Icons.login,
              color: isRegister ? ux.gold : colorScheme.primary,
              textColor: Colors.white,
              onTap: isRegister ? _handleRegister : _handleEmailSignIn,
              isLoading: _isSigningIn &&
                  (_activeProvider == 'email' || _activeProvider == 'register'),
            ),

            const SizedBox(height: 12),

            // Toggle between login and register
            TextButton(
              onPressed: () {
                HapticFeedback.selectionClick();
                setState(() {
                  _authMode = isRegister ? _AuthMode.login : _AuthMode.register;
                  _obscurePassword = true;
                });
              },
              child: Text.rich(
                TextSpan(
                  text: isRegister ? 'Already have an account? ' : 'New here? ',
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                  ),
                  children: [
                    TextSpan(
                      text: isRegister ? 'Sign in' : 'Create account',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: ux.gold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Back to social buttons
            TextButton(
              onPressed: () {
                HapticFeedback.selectionClick();
                setState(() => _authMode = _AuthMode.buttons);
              },
              child: Text(
                'Back to sign-in options',
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Input Decoration Helper ───────────────────────────────────────

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    required ColorScheme colorScheme,
    required UnjynxCustomColors ux,
    required bool isLight,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        color: colorScheme.onSurfaceVariant.withValues(alpha: isLight ? 0.5 : 0.4),
      ),
      prefixIcon: Icon(
        icon,
        color: colorScheme.onSurfaceVariant.withValues(alpha: isLight ? 0.6 : 0.5),
        size: 22,
      ),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: isLight ? Colors.white : Colors.white.withValues(alpha: 0.06),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
        borderSide: BorderSide(color: ux.gold, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.error, width: 1.5),
      ),
    );
  }
}

// ── Auth Mode ─────────────────────────────────────────────────────────

enum _AuthMode { buttons, login, register }

// ── Brand Section ─────────────────────────────────────────────────────

class _BrandSection extends StatelessWidget {
  const _BrandSection();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Column(
      children: [
        Container(
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
          child: Icon(Icons.bolt_rounded, size: 44, color: ux.gold),
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
            color: isLight ? ux.gold : ux.gold.withValues(alpha: 0.7),
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

// ── Sign-In Button ────────────────────────────────────────────────────

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
