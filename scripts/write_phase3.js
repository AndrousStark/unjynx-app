const fs = require('fs');
const path = 'C:/Users/SaveLIFE Foundation/Downloads/personal/Project- TODO Reminder app/COMPREHENSIVE-PHASE-PLAN.doc';

const content = `

################################################################################
  PHASE 3: CHANNELS AND NOTIFICATIONS
  Timeline: Weeks 11-14 (4 weeks) | Status: PLANNED
  Screens: J1-J6 (6 screens)
  Backend: BullMQ queue system, 8 channel integrations, 20+ endpoints
################################################################################

  OVERVIEW:
  ---------
  Phase 3 makes UNJYNX's core differentiator real: multi-channel reminders
  via Push, Telegram, Email, WhatsApp, SMS, Instagram, Slack, Discord.
  By the end, users get reminders wherever they actually pay attention.

  PREREQUISITES:
  - Phase 2 complete (17 screens, 341+ tests, task CRUD working)
  - Docker stack running (Valkey for BullMQ, Mailpit for email dev)

  SUCCESS CRITERIA:
  - All 8 channels functional with test messages
  - BullMQ queue-per-channel architecture operational
  - Notification preferences UI complete
  - Quota enforcement working per plan tier
  - 500+ total tests

================================================================================
  TASK 3.1: BACKEND - BullMQ Queue Architecture
  Duration: 4 days | Week 11
================================================================================

  WHAT:
  Set up queue-per-channel architecture for reliable message delivery
  with retry, dead letter queues, and escalation chains.

  QUEUE ARCHITECTURE:
  notification:push       - Push notifications (FCM)
  notification:telegram   - Telegram Bot API messages
  notification:email      - SendGrid email delivery
  notification:whatsapp   - Gupshup BSP WhatsApp templates
  notification:sms        - MSG91 SMS delivery
  notification:instagram  - Instagram Messenger API DMs
  notification:slack      - Slack webhook messages
  notification:discord    - Discord webhook messages
  notification:digest     - Batches tasks into single daily digest
  notification:escalation - Handles fallback chain when primary fails

  SUB-TASKS:
  3.1.1  Set up BullMQ with Valkey (Redis-compatible) connection
         - Connection pool: src/queue/connection.ts
         - Queue factory: src/queue/queue-factory.ts
  3.1.2  Create NotificationDispatcher service:
         - Accepts: (userId, taskId, messageType, channel)
         - Checks user quota (plan-based daily limits)
         - Routes to correct queue
         - Supports channel priority/fallback
  3.1.3  Implement retry policy per channel:
         - Exponential backoff with jitter:
           delay = min(cap, base * 2^attempt) + random(0, base)
           base = 1000ms, cap = 30000ms, max attempts = 3
         - On final failure: move to Dead Letter Queue
  3.1.4  Dead Letter Queue (DLQ) per channel:
         - Store failed messages for manual review
         - Alert when DLQ exceeds threshold (Prometheus metric)
  3.1.5  Escalation chain logic:
         - User configures: primary -> fallback1 -> fallback2
         - If primary fails all retries -> try fallback1
         - If fallback1 fails -> try fallback2
         - If all fail -> DLQ + push notification "delivery failed"
  3.1.6  Daily digest queue:
         - Cron job at user's configured morning time
         - Batch all today's tasks + daily content into one message
         - Counts as 1 message regardless of task count
  3.1.7  Quota enforcement middleware:
         - Track daily usage per user per channel
         - Valkey counter with midnight TTL (user timezone)
         - Reject if over quota, return remaining count
         - Quotas: Free (Push+Telegram unlimited, Email 5/day)
                   Pro (WhatsApp 10/day, SMS 5/day, IG 3/day, etc.)
                   Team (WhatsApp 15/day, SMS 10/day, etc.)
  3.1.8  Message template system:
         - Templates per channel per message type
         - Variables: {task_title}, {due_time}, {project_name}, etc.
         - Channel-specific formatting (HTML for email, plain for SMS)
  3.1.9  Write Vitest tests (15+ tests):
         - Queue routing, retry logic, quota enforcement
         - Escalation chain, DLQ behavior, digest batching

  API ENDPOINTS:
  POST   /api/v1/notifications/send-test    - Test message to channel
  GET    /api/v1/notifications/status        - Recent delivery status
  GET    /api/v1/notifications/quota         - Usage vs daily quota
  POST   /api/v1/notifications/preferences   - Update prefs
  GET    /api/v1/notifications/preferences   - Get prefs

  BACKEND PACKAGES: bullmq 5.x, ioredis 5.x

  DSA:
  - Priority queue (min-heap): job scheduling by delivery time
  - Exponential backoff with jitter: randomized retry delay
  - Sliding window counter: quota tracking per channel per day
  - Linked list: escalation chain (channel1 -> channel2 -> channel3)

================================================================================
  TASK 3.2: BACKEND - Push Notification Service
  Duration: 2 days | Week 11
================================================================================

  WHAT:
  Push notifications via awesome_notifications + FCM. NOT firebase_messaging.

  SUB-TASKS:
  3.2.1  Backend: FCM admin SDK setup (firebase-admin)
         - Service account key management (env var, never committed)
         - Send notification via FCM HTTP v1 API
  3.2.2  Notification categories:
         - task_reminder: "Task X due in 30 min"
         - overdue_alert: "Task X is overdue"
         - streak_nudge: "1 task left to keep your streak"
         - daily_digest: "3 tasks today. Top: Task X"
         - content_delivery: "Your daily wisdom is ready"
         - team_update: "Alice completed Task Y"
  3.2.3  Action buttons in push:
         - [Mark Done] -> API call POST /tasks/:id/complete
         - [Snooze 1hr] -> API call POST /tasks/:id/snooze
         - Tap notification -> deep link to task detail
  3.2.4  Silent push for sync triggers:
         - When server has new data -> silent push -> Flutter sync
  3.2.5  Badge count management:
         - Increment on new notification, decrement on read
  3.2.6  Flutter: awesome_notifications setup:
         - Channels: task_reminders, daily_content, team, system
         - Scheduled local notifications for Pomodoro
         - awesome_notifications_fcm for remote push
  3.2.7  Write tests (8+ tests)

  API ENDPOINTS:
  POST   /api/v1/push/register     - Register device FCM token
  DELETE /api/v1/push/unregister   - Remove device token
  POST   /api/v1/push/send         - Internal, queue-triggered

  FLUTTER PACKAGES:
  awesome_notifications 0.9.x, awesome_notifications_fcm 0.9.x

================================================================================
  TASK 3.3: BACKEND - Telegram Bot Integration
  Duration: 3 days | Week 11-12
================================================================================

  WHAT:
  Telegram Bot API integration. FREE channel ($0 per message).
  Bot: @UNJYNXBot. First external channel to implement.

  SUB-TASKS:
  3.3.1  Create Telegram bot via @BotFather:
         - Name: UNJYNX, Username: @UNJYNXBot
         - Set description, profile photo, commands
  3.3.2  grammy bot framework setup:
         - Webhook mode (not polling) for production
         - Long polling for local dev
         - src/services/channels/telegram.service.ts
  3.3.3  Connection flow:
         - Generate unique user token
         - Deep link: t.me/UNJYNXBot?start=[USER_TOKEN]
         - On /start command with token: link Telegram chat_id to user
         - Confirm to user: "Connected! You'll get reminders here."
         - Update app via WebSocket: channel now connected
  3.3.4  Message types with inline keyboards:
         - task_reminder: Title + due time + [Mark Done] [Snooze 1hr]
         - daily_digest: Task list + content quote
         - daily_content: Quote + source + [Save] [Share]
         - streak_nudge: Streak count + motivational copy
         - overdue_alert: Title + how long overdue + [View] [Snooze]
  3.3.5  Callback query handler (button presses):
         - "done:{taskId}" -> complete task via API
         - "snooze:{taskId}" -> snooze 1 hour
         - "save:{contentId}" -> save content
  3.3.6  Write tests (10+ tests)

  API ENDPOINTS:
  POST   /api/v1/channels/telegram/connect      - Generate link
  POST   /api/v1/channels/telegram/webhook       - Telegram webhook
  DELETE /api/v1/channels/telegram/disconnect     - Disconnect
  POST   /api/v1/channels/telegram/test          - Send test message

  BACKEND PACKAGES: grammy 1.x

================================================================================
  TASK 3.4: BACKEND - Email Service
  Duration: 2 days | Week 12
================================================================================

  WHAT:
  Email delivery via SendGrid (prod) / Mailpit (dev).

  SUB-TASKS:
  3.4.1  SendGrid setup:
         - API key management (env var)
         - Domain verification (DNS records)
         - Sender identity: noreply@unjynx.com
  3.4.2  Email templates (MJML -> HTML):
         - task_reminder: Task card with action buttons
         - daily_digest: Task list + content + progress rings
         - daily_content: Beautiful quote card layout
         - weekly_summary: Week stats + insights
         - streak_milestone: Celebration + streak stats
         - All templates: UNJYNX branding (midnight purple + gold)
  3.4.3  Unsubscribe link (CAN-SPAM compliance):
         - One-click unsubscribe header (List-Unsubscribe)
         - Unsubscribe page: manage per-type email preferences
  3.4.4  Bounce handling webhook:
         - Mark bounced emails as invalid
         - Auto-disable channel after 3 hard bounces
  3.4.5  Write tests (8+ tests)

  API ENDPOINTS:
  PUT    /api/v1/channels/email/verify      - Verify email
  POST   /api/v1/channels/email/test        - Send test
  POST   /api/v1/channels/email/send        - Queue-triggered

  BACKEND PACKAGES: @sendgrid/mail 8.x, mjml 4.x

================================================================================
  TASK 3.5: BACKEND - WhatsApp BSP Integration
  Duration: 4 days | Week 12-13
================================================================================

  WHAT:
  WhatsApp via Gupshup BSP. Cheapest for India (~Rs 0.13/utility template).

  SUB-TASKS:
  3.5.1  Gupshup account setup:
         - Register BSP account
         - Get WhatsApp Business API access
         - Verify business profile
  3.5.2  Template approval flow:
         - Submit templates to Gupshup for Meta approval
         - Templates (all utility category):
           task_reminder: "[App] Reminder: {title} due in {time}. Tap to view."
           daily_digest: "[App] Today: {count} tasks. Top: {title}"
           daily_content: "[App] Daily wisdom: {quote} - {author}"
           overdue_alert: "[App] Overdue: {title}. Tap to reschedule."
           streak_nudge: "[App] {count} tasks left to keep your streak!"
  3.5.3  Phone number connection:
         - Country code auto-detection
         - OTP verification via WhatsApp or SMS fallback
         - Consent screen with opt-in text (TRAI compliance)
  3.5.4  Interactive buttons on messages:
         - [Mark Done] [Snooze 1hr] [View Task]
         - Webhook handler for button responses
  3.5.5  Webhook for delivery receipts:
         - sent, delivered, read, failed statuses
         - Update notification_log with status
  3.5.6  Cost tracking:
         - Log per-message cost (utility vs marketing rate)
         - Daily/monthly aggregation for billing visibility
  3.5.7  Quota enforcement:
         - Pro: 10/day, Team: 15/day
         - Add-on pack: +50/day for Rs 49/mo
  3.5.8  Write tests (12+ tests)

  API ENDPOINTS:
  POST   /api/v1/channels/whatsapp/connect     - Phone + OTP
  POST   /api/v1/channels/whatsapp/verify      - Verify OTP
  POST   /api/v1/channels/whatsapp/webhook      - Gupshup webhook
  DELETE /api/v1/channels/whatsapp/disconnect    - Disconnect
  POST   /api/v1/channels/whatsapp/test         - Send test

  BACKEND PACKAGES: axios (Gupshup REST API)

================================================================================
  TASK 3.6: BACKEND - SMS Service
  Duration: 2 days | Week 13
================================================================================

  WHAT:
  SMS via MSG91 (India) / Twilio fallback (international).

  SUB-TASKS:
  3.6.1  MSG91 setup:
         - DLT registration (TRAI compliance for India)
         - Entity registration as "Principal Entity"
         - Template pre-approval on DLT platform
  3.6.2  SMS templates (160-char limit):
         - task_reminder: "UNJYNX: {title} due in {time}. Reply DONE or SNOOZE."
         - daily_digest: "UNJYNX: {count} tasks today. Top: {title}"
         - overdue: "UNJYNX: {title} overdue. Reply DONE or SNOOZE."
         - streak: "UNJYNX: {count} tasks left for your streak!"
  3.6.3  Reply handling (inbound SMS webhook):
         - DONE -> complete task
         - SNOOZE -> snooze 1 hour
         - STOP -> unsubscribe (mandatory TCPA/TRAI)
         - HELP -> send command list
  3.6.4  Quota: Pro 5/day, Team 10/day
  3.6.5  Write tests (8+ tests)

  API ENDPOINTS:
  POST   /api/v1/channels/sms/connect     - Phone + OTP
  POST   /api/v1/channels/sms/verify      - Verify OTP
  POST   /api/v1/channels/sms/webhook     - Delivery/reply webhook
  DELETE /api/v1/channels/sms/disconnect   - Disconnect
  POST   /api/v1/channels/sms/test        - Send test

  BACKEND PACKAGES: axios (MSG91 API)

================================================================================
  TASK 3.7: BACKEND - Instagram Friend First Flow
  Duration: 3 days | Week 13
================================================================================

  WHAT:
  Instagram Messenger API with "Friend First" approach for Pro users.

  SUB-TASKS:
  3.7.1  Instagram Business account setup for @UNJYNX
  3.7.2  Meta Graph API integration:
         - Page access token management
         - Messenger API permissions
  3.7.3  Friend First connection flow:
         - User enters Instagram username
         - Backend follows user from @UNJYNX account
         - Backend sends initial DM: "Hi! Reply START to activate"
         - User replies -> 24h messaging window opens
         - Store user's Instagram-scoped ID
  3.7.4  Window management:
         - Daily content keeps 24h window alive
         - User must interact (react/reply) to keep window open
         - If expired: push notification to reconnect
         - Track window_expires_at per user
  3.7.5  Message types (limited by 24h window):
         - task_reminder: Text + quick reply buttons
         - daily_content: Quote card (image) + text
  3.7.6  Quota: Pro 3/day
  3.7.7  Write tests (8+ tests)

  API ENDPOINTS:
  POST   /api/v1/channels/instagram/connect      - Start follow
  POST   /api/v1/channels/instagram/webhook       - Messenger webhook
  GET    /api/v1/channels/instagram/status         - Window status
  DELETE /api/v1/channels/instagram/disconnect     - Disconnect

  BACKEND PACKAGES: axios (Meta Graph API)

================================================================================
  TASK 3.8: BACKEND - Slack and Discord Integration
  Duration: 2 days | Week 14
================================================================================

  WHAT:
  Slack and Discord via OAuth 2.0 + webhook messages.

  SUB-TASKS:
  3.8.1  Slack integration:
         - Create Slack app (api.slack.com)
         - OAuth 2.0 flow: request channels:write scope
         - User selects channel for reminders
         - Messages via chat.postMessage with Block Kit
         - Action buttons: [Mark Done] [Snooze 1hr]
         - Interactivity webhook for button responses

  3.8.2  Discord integration:
         - Create Discord app (discord.com/developers)
         - OAuth 2.0 flow: request webhook scope
         - User selects server + channel
         - Messages via webhook with components (buttons)
         - Interaction endpoint for button responses

  3.8.3  Shared template structure:
         - Both support rich formatting (Slack Block Kit, Discord Embeds)
         - Both support action buttons
         - Message types: task_reminder, daily_digest, daily_content

  3.8.4  Quota: Pro 10/day, Team 20/day per channel
  3.8.5  Write tests (10+ tests)

  API ENDPOINTS (same pattern both channels):
  POST   /api/v1/channels/slack/connect       - OAuth redirect
  GET    /api/v1/channels/slack/callback       - OAuth callback
  DELETE /api/v1/channels/slack/disconnect     - Disconnect
  POST   /api/v1/channels/slack/test          - Test message
  POST   /api/v1/channels/discord/connect     - OAuth redirect
  GET    /api/v1/channels/discord/callback    - OAuth callback
  DELETE /api/v1/channels/discord/disconnect  - Disconnect
  POST   /api/v1/channels/discord/test        - Test message

  BACKEND PACKAGES: @slack/web-api 7.x, discord.js 14.x

================================================================================
  TASK 3.9: FLUTTER - Channel Hub and Connection Screens (J1-J6)
  Duration: 4 days | Week 14
================================================================================

  SCREENS: J1 (Channel Hub), J2 (Telegram), J3 (WhatsApp),
           J4 (Instagram), J5 (Notification Prefs), J6 (SMS)

  SUB-TASKS:
  3.9.1  J1 - Channel Hub Screen:
         - List of all 8 channels with connection status
         - Each channel card:
           Icon + Name + Status (Connected/Not Connected)
           Tier badge (Free/Pro) if locked
           Last message sent timestamp
           "Test" button (sends test message)
           Tap to expand: quiet hours, digest mode, fallback order
         Files:
         - lib/presentation/screens/channel_hub_screen.dart
         - lib/presentation/widgets/channel_card.dart
         - lib/presentation/widgets/channel_status.dart

  3.9.2  J2 - Telegram Connection:
         - QR code (qr_flutter) + deep link button
         - Real-time status via WebSocket
         - On connect: celebration + test message prompt
         Files:
         - lib/presentation/screens/telegram_connect_screen.dart

  3.9.3  J3 - WhatsApp Connection (Pro):
         - Phone input with country code auto-detection
         - OTP verification screen
         - Consent/opt-in screen (TRAI compliant text)
         - Confirmation + test message
         Files:
         - lib/presentation/screens/whatsapp_connect_screen.dart

  3.9.4  J4 - Instagram Friend First (Pro):
         - Username input
         - Explanation screen ("We'll send a follow request...")
         - Status tracking (pending follow -> accepted -> active)
         Files:
         - lib/presentation/screens/instagram_connect_screen.dart

  3.9.5  J5 - Notification Preferences:
         - Primary channel selector
         - Fallback chain order (drag to reorder)
         - Quiet hours: start + end time per timezone
         - Max reminders per day slider (1-50)
         - Digest mode: Off | Hourly | Daily
         - Advance reminder: 5m | 15m | 30m | 1hr | 1day
         - Per-task override toggle
         - Team notifications (if Team plan)
         Files:
         - lib/presentation/screens/notification_prefs_screen.dart

  3.9.6  J6 - SMS Connection (Pro):
         - Phone input + OTP + consent screen
         Files:
         - lib/presentation/screens/sms_connect_screen.dart

  3.9.7  Riverpod providers:
         - channelListProvider (all channels with status)
         - channelConnectionProvider (connection flow state)
         - notificationPrefsProvider (user preferences)
         - messageQuotaProvider (usage vs daily quota per channel)

  3.9.8  Write tests (15+ tests)

  FLUTTER PACKAGES:
  - qr_flutter 4.x (Telegram QR code)
  - url_launcher 6.x (deep links)
  - country_code_picker 3.x (phone number input)

================================================================================
  PHASE 3 SUMMARY
================================================================================

  TESTING:
  Backend: 80+ new (queue arch, 8 channel services, webhooks, quotas)
  Flutter: 15+ new (6 screens, providers)
  TOTAL PHASE 3: ~95 new tests
  CUMULATIVE: ~436 total (341 Phase 2 + 95 Phase 3)

  DSA USED:
  - Priority queue (min-heap): Job scheduling by delivery time
  - Exponential backoff with jitter: Retry delay calculation
  - Sliding window counter: Daily quota tracking per channel
  - Linked list: Escalation/fallback chain traversal
  - Template variable interpolation: String pattern matching

  TOOLS:
  Backend: bullmq 5.x, ioredis 5.x, grammy 1.x, @sendgrid/mail 8.x,
           mjml 4.x, @slack/web-api 7.x, discord.js 14.x, axios
  Flutter: awesome_notifications 0.9.x, awesome_notifications_fcm 0.9.x,
           qr_flutter 4.x, url_launcher 6.x, country_code_picker 3.x
`;

fs.appendFileSync(path, content);
const lines = fs.readFileSync(path, 'utf8').split('\n').length;
console.log('Phase 3 written. Total lines:', lines);
