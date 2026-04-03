import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'api_auth_port.dart';
import 'auth_providers.dart';

/// 6-digit OTP email verification screen.
///
/// Shown after registration. User enters the code sent to their email.
/// Auto-verifies when all 6 digits are entered.
class EmailVerificationPage extends ConsumerStatefulWidget {
  const EmailVerificationPage({required this.email, super.key});

  final String email;

  @override
  ConsumerState<EmailVerificationPage> createState() =>
      _EmailVerificationPageState();
}

class _EmailVerificationPageState extends ConsumerState<EmailVerificationPage>
    with SingleTickerProviderStateMixin {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  bool _isVerifying = false;
  bool _isResending = false;
  bool _verified = false;
  String? _error;
  int _resendCooldown = 0;
  Timer? _cooldownTimer;

  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
    _startCooldown();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _cooldownTimer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  void _onDigitChanged(int index, String value) {
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    setState(() => _error = null);

    if (_code.length == 6) {
      _verify();
    }
  }

  void _startCooldown() {
    _resendCooldown = 60;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        _resendCooldown--;
        if (_resendCooldown <= 0) t.cancel();
      });
    });
  }

  Future<void> _verify() async {
    if (_isVerifying || _code.length != 6) return;

    setState(() {
      _isVerifying = true;
      _error = null;
    });
    HapticFeedback.mediumImpact();

    try {
      final dio = Dio();
      final auth = ref.read(authPortProvider);
      final baseUrl = auth is ApiAuthPort
          ? auth.apiBaseUrl
          : 'https://api.unjynx.me';

      final response = await dio.post<Map<String, dynamic>>(
        '$baseUrl/api/v1/auth/verify-email',
        data: {'email': widget.email, 'code': _code},
      );

      if (!mounted) return;

      final data = response.data;
      if (data != null && data['success'] == true) {
        HapticFeedback.heavyImpact();
        setState(() => _verified = true);
        ref.invalidate(currentUserProvider);
        await Future<void>.delayed(const Duration(seconds: 2));
        if (mounted) context.go('/');
      } else {
        setState(() => _error = 'Invalid code. Please try again.');
        _clearFields();
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data is Map
            ? (e.response!.data as Map)['error'] as String? ??
                  'Verification failed'
            : 'Verification failed';
        setState(() => _error = msg);
        _clearFields();
      }
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resend() async {
    if (_isResending || _resendCooldown > 0) return;

    setState(() => _isResending = true);
    HapticFeedback.lightImpact();

    try {
      final dio = Dio();
      final auth = ref.read(authPortProvider);
      final baseUrl = auth is ApiAuthPort
          ? auth.apiBaseUrl
          : 'https://api.unjynx.me';

      await dio.post<Map<String, dynamic>>(
        '$baseUrl/api/v1/auth/resend-verification',
        data: {'email': widget.email},
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification code resent')),
        );
        _startCooldown();
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to resend code')));
      }
    } finally {
      if (mounted) setState(() => _isResending = false);
    }
  }

  void _clearFields() {
    for (final c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              children: [
                const Spacer(flex: 2),

                // Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: _verified
                        ? const LinearGradient(
                            colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                          )
                        : LinearGradient(
                            colors: [colorScheme.primary, colorScheme.tertiary],
                          ),
                  ),
                  child: Icon(
                    _verified
                        ? Icons.check_rounded
                        : Icons.mark_email_read_rounded,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  _verified ? 'Email Verified!' : 'Verify Your Email',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _verified
                      ? 'Redirecting you to the app...'
                      : 'Enter the 6-digit code sent to',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (!_verified) ...[
                  const SizedBox(height: 4),
                  Text(
                    widget.email,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: colorScheme.primary,
                    ),
                  ),
                ],
                const SizedBox(height: 32),

                // OTP boxes
                if (!_verified)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(6, (i) {
                      return Container(
                        width: 48,
                        height: 56,
                        margin: EdgeInsets.only(
                          right: i < 5 ? (i == 2 ? 16 : 8) : 0,
                        ),
                        child: TextField(
                          controller: _controllers[i],
                          focusNode: _focusNodes[i],
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          maxLength: 1,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            counterText: '',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: _error != null
                                    ? colorScheme.error
                                    : colorScheme.outlineVariant,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: colorScheme.primary,
                                width: 2,
                              ),
                            ),
                            filled: true,
                            fillColor: colorScheme.surfaceContainerHighest
                                .withValues(alpha: 0.3),
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          onChanged: (v) => _onDigitChanged(i, v),
                        ),
                      );
                    }),
                  ),

                // Error
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.error,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],

                // Loading
                if (_isVerifying) ...[
                  const SizedBox(height: 24),
                  const CircularProgressIndicator(),
                ],

                const SizedBox(height: 32),

                // Resend
                if (!_verified)
                  TextButton(
                    onPressed: _resendCooldown > 0 || _isResending
                        ? null
                        : _resend,
                    child: Text(
                      _resendCooldown > 0
                          ? 'Resend code in ${_resendCooldown}s'
                          : 'Resend verification code',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: _resendCooldown > 0
                            ? colorScheme.onSurfaceVariant
                            : colorScheme.primary,
                      ),
                    ),
                  ),

                const Spacer(flex: 3),

                // Skip (for now)
                if (!_verified)
                  TextButton(
                    onPressed: () => context.go('/'),
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
      ),
    );
  }
}
