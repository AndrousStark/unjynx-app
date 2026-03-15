import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import 'instagram_setup_ui.dart';
import 'phone_setup_ui.dart';
import 'push_email_oauth_setup_ui.dart';
import 'telegram_setup_ui.dart';

/// Result from the channel setup bottom sheet.
class ChannelSetupResult {
  const ChannelSetupResult({
    required this.identifier,
    required this.displayName,
  });

  final String identifier;
  final String displayName;
}

/// Channel-specific setup bottom sheet that adapts UI based on channel type.
class ChannelSetupSheet extends StatefulWidget {
  const ChannelSetupSheet({super.key, required this.channelType});

  final String channelType;

  @override
  State<ChannelSetupSheet> createState() => _ChannelSetupSheetState();
}

class _ChannelSetupSheetState extends State<ChannelSetupSheet> {
  final _controller = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;

  @override
  void dispose() {
    _controller.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: EdgeInsets.only(bottom: bottomInset),
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        color: isLight ? Colors.white : colorScheme.surfaceContainer,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
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
                    borderRadius: BorderRadius.circular(2),
                    color: colorScheme.onSurfaceVariant
                        .withValues(alpha: 0.2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Title
              Text(
                _setupTitle,
                style: textTheme.headlineSmall?.copyWith(
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _setupDescription,
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.7 : 0.55),
                ),
              ),
              const SizedBox(height: 20),

              // Channel-specific UI
              ..._buildSetupUI(context, colorScheme, textTheme, ux, isLight),

              const SizedBox(height: 20),

              // Action button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _onSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ux.gold,
                    foregroundColor:
                        isLight ? const Color(0xFF1A0533) : Colors.black,
                    elevation: isLight ? 2 : 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    _actionLabel,
                    style: textTheme.titleMedium?.copyWith(
                      color:
                          isLight ? const Color(0xFF1A0533) : Colors.black,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String get _setupTitle {
    return switch (widget.channelType) {
      'push' => 'Enable Push Notifications',
      'whatsapp' => 'Verify Phone Number',
      'sms' => 'Verify Phone Number',
      'telegram' => 'Connect via Bot',
      'email' => 'Verify Email Address',
      'instagram' => 'Connect Instagram',
      'slack' => 'Connect Slack',
      'discord' => 'Connect Discord',
      _ => 'Connect Channel',
    };
  }

  String get _setupDescription {
    return switch (widget.channelType) {
      'push' =>
        'Allow UNJYNX to send push notifications to this device.',
      'whatsapp' =>
        'Enter your WhatsApp phone number. We will send a 6-digit OTP to verify.',
      'sms' =>
        'Enter your phone number. We will send a 6-digit OTP to verify.',
      'telegram' =>
        'Open Telegram, find @UnjynxBot, and send /start. Then paste the verification code here.',
      'email' =>
        'Enter your email address. We will send a verification link.',
      'instagram' =>
        'Enter your Instagram username. You will need to accept a follow request from @unjynx_official.',
      'slack' =>
        'Connect your Slack workspace via OAuth. You will be redirected to Slack.',
      'discord' =>
        'Connect your Discord account via OAuth. You will be redirected to Discord.',
      _ => 'Set up this notification channel.',
    };
  }

  String get _actionLabel {
    return switch (widget.channelType) {
      'push' => 'Enable Notifications',
      'whatsapp' || 'sms' => _otpSent ? 'Verify OTP' : 'Send OTP',
      'telegram' => 'Verify Code',
      'email' => 'Send Verification',
      'instagram' => 'Connect',
      'slack' || 'discord' => 'Authorize',
      _ => 'Connect',
    };
  }

  List<Widget> _buildSetupUI(
    BuildContext context,
    ColorScheme colorScheme,
    TextTheme textTheme,
    UnjynxCustomColors ux,
    bool isLight,
  ) {
    return switch (widget.channelType) {
      'push' => buildPushSetupUI(
          colorScheme: colorScheme,
          ux: ux,
          isLight: isLight,
        ),
      'whatsapp' || 'sms' => buildPhoneSetupUI(
          controller: _controller,
          otpController: _otpController,
          otpSent: _otpSent,
          colorScheme: colorScheme,
          textTheme: textTheme,
          ux: ux,
          isLight: isLight,
        ),
      'telegram' => buildTelegramSetupUI(
          controller: _controller,
          colorScheme: colorScheme,
          textTheme: textTheme,
          ux: ux,
          isLight: isLight,
        ),
      'email' => buildEmailSetupUI(
          controller: _controller,
          colorScheme: colorScheme,
          textTheme: textTheme,
          ux: ux,
          isLight: isLight,
        ),
      'instagram' => buildInstagramSetupUI(
          controller: _controller,
          colorScheme: colorScheme,
          textTheme: textTheme,
          ux: ux,
          isLight: isLight,
        ),
      'slack' || 'discord' => buildOAuthSetupUI(
          channelType: widget.channelType,
          context: context,
          colorScheme: colorScheme,
          ux: ux,
          isLight: isLight,
        ),
      _ => [],
    };
  }

  void _onSubmit() {
    HapticFeedback.mediumImpact();

    // Validate input before proceeding
    final validationError = _validateInput();
    if (validationError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(validationError),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    // For phone channels, handle OTP flow
    if ((widget.channelType == 'whatsapp' || widget.channelType == 'sms') &&
        !_otpSent) {
      setState(() => _otpSent = true);
      return;
    }

    // When OTP has been sent, read from the OTP controller
    final identifier =
        (widget.channelType == 'whatsapp' || widget.channelType == 'sms') &&
                _otpSent
            ? _otpController.text.trim()
            : _controller.text.isNotEmpty
                ? _controller.text.trim()
                : _defaultIdentifier(widget.channelType);

    Navigator.of(context).pop(
      ChannelSetupResult(
        identifier: identifier,
        displayName: _controller.text.isNotEmpty
            ? _controller.text.trim()
            : _defaultDisplayName(widget.channelType),
      ),
    );
  }

  /// Returns an error message if validation fails, or null if input is valid.
  String? _validateInput() {
    final text = _controller.text.trim();

    switch (widget.channelType) {
      case 'whatsapp' || 'sms':
        if (!_otpSent) {
          // Validating phone number before sending OTP
          if (text.isEmpty) {
            return 'Please enter a phone number';
          }
          final digitsOnly = text.replaceAll(RegExp(r'[^0-9]'), '');
          if (digitsOnly.length < 10) {
            return 'Phone number must have at least 10 digits';
          }
        } else {
          // Validating OTP after it was sent
          final otp = _otpController.text.trim();
          if (otp.isEmpty || otp.length != 6) {
            return 'Please enter the 6-digit OTP';
          }
        }
        return null;

      case 'email':
        if (text.isEmpty || !text.contains('@') || !text.contains('.')) {
          return 'Please enter a valid email address';
        }
        return null;

      case 'telegram':
        if (text.isEmpty) {
          return 'Please enter your Telegram verification code';
        }
        return null;

      case 'instagram':
        if (text.isEmpty) {
          return 'Please enter your Instagram username';
        }
        return null;

      default:
        return null;
    }
  }

  String _defaultIdentifier(String type) {
    return switch (type) {
      'push' => 'device_token',
      'telegram' => 'chat_123456',
      'email' => 'user@example.com',
      'whatsapp' => '9800000000',
      'sms' => '9800000000',
      'instagram' => 'unjynx_user',
      'slack' => 'U01ABC123',
      'discord' => 'user#1234',
      _ => 'unknown',
    };
  }

  String _defaultDisplayName(String type) {
    return switch (type) {
      'push' => 'This device',
      'telegram' => '@unjynx_user',
      'email' => 'user@example.com',
      'whatsapp' => '+91 98000 00000',
      'sms' => '+91 98000 00000',
      'instagram' => '@unjynx_user',
      'slack' => 'UNJYNX Workspace',
      'discord' => 'user#1234',
      _ => type,
    };
  }
}
