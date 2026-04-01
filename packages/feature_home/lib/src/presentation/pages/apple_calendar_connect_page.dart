import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

/// Apple Calendar (CalDAV) connection page.
///
/// Collects the user's CalDAV URL (pre-filled with iCloud), Apple ID email,
/// and app-specific password. On submit, calls the backend to validate and
/// store the CalDAV credentials.
class AppleCalendarConnectPage extends ConsumerStatefulWidget {
  const AppleCalendarConnectPage({super.key});

  @override
  ConsumerState<AppleCalendarConnectPage> createState() =>
      _AppleCalendarConnectPageState();
}

class _AppleCalendarConnectPageState
    extends ConsumerState<AppleCalendarConnectPage> {
  final _formKey = GlobalKey<FormState>();
  final _caldavUrlController =
      TextEditingController(text: 'https://caldav.icloud.com');
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void dispose() {
    _caldavUrlController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleConnect() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isLoading) return;

    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final calendarApi = ref.read(calendarApiProvider);
      final response = await calendarApi.connectApple(
        caldavUrl: _caldavUrlController.text.trim(),
        username: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (response.success) {
        HapticFeedback.lightImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Apple Calendar connected successfully'),
          ),
        );
        context.pop(true);
      } else {
        setState(() {
          _errorMessage = response.error ?? 'Failed to connect';
        });
      }
    } on Exception catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Apple Calendar'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icon + description
                Icon(
                  Icons.event_rounded,
                  size: 56,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Connect your Apple Calendar',
                  style: textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Your calendar events will appear alongside your UNJYNX tasks. '
                  'You need an app-specific password from Apple.',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // CalDAV URL field
                TextFormField(
                  controller: _caldavUrlController,
                  decoration: InputDecoration(
                    labelText: 'CalDAV URL',
                    hintText: 'https://caldav.icloud.com',
                    prefixIcon: const Icon(Icons.link_rounded),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    helperText: 'Default iCloud URL is pre-filled',
                  ),
                  keyboardType: TextInputType.url,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'CalDAV URL is required';
                    }
                    if (!value.startsWith('http')) {
                      return 'Must be a valid URL';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email field
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Apple ID Email',
                    hintText: 'your@icloud.com',
                    prefixIcon: const Icon(Icons.email_rounded),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Apple ID email is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // App-specific password field
                TextFormField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: 'App-Specific Password',
                    hintText: 'xxxx-xxxx-xxxx-xxxx',
                    prefixIcon: const Icon(Icons.lock_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_rounded
                            : Icons.visibility_rounded,
                      ),
                      onPressed: () {
                        setState(
                          () => _obscurePassword = !_obscurePassword,
                        );
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  obscureText: _obscurePassword,
                  autocorrect: false,
                  enableSuggestions: false,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'App-specific password is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Help link
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      // In production, this would open the URL in a browser
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Visit appleid.apple.com > Sign-In and Security > '
                            'App-Specific Passwords to generate one.',
                          ),
                          duration: Duration(seconds: 6),
                        ),
                      );
                    },
                    icon: Icon(
                      Icons.help_outline_rounded,
                      size: 16,
                      color: colorScheme.primary,
                    ),
                    label: Text(
                      'How to get an app-specific password',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Error message
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.error_outline_rounded,
                          size: 20,
                          color: colorScheme.onErrorContainer,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: textTheme.bodySmall?.copyWith(
                              color: colorScheme.onErrorContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Connect button
                FilledButton(
                  onPressed: _isLoading ? null : _handleConnect,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: colorScheme.onPrimary,
                          ),
                        )
                      : const Text('Connect Apple Calendar'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
