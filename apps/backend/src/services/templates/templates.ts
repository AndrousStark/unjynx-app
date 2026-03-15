// ── Message Templates ─────────────────────────────────────────────────
// Constant map of message type -> channel -> template parts.
// Each entry provides text (always), markdown (Telegram/Slack),
// html (email), and subject (email).

export interface TemplateEntry {
  readonly text: string;
  readonly markdown?: string;
  readonly html?: string;
  readonly subject?: string;
  readonly slackBlocks?: readonly unknown[];
  readonly discordEmbed?: unknown;
}

type ChannelTemplates = Readonly<Record<string, TemplateEntry>>;
type TemplateMap = Readonly<Record<string, ChannelTemplates>>;

// ── Brand constants for HTML templates ───────────────────────────────
const PURPLE = "#6B21A8";
const GOLD = "#D4AF37";

function htmlWrap(body: string): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;"><div style="text-align:center;margin-bottom:16px;"><span style="font-size:24px;font-weight:700;color:${PURPLE};">UNJYNX</span></div>${body}<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">Break the satisfactory. Unjynx your productivity.</div></div>`;
}

// ── Template definitions ─────────────────────────────────────────────

export const TEMPLATES: TemplateMap = {
  task_reminder: {
    push: {
      text: "Hey {user_name}! '{task_title}' is due {due_time}. Time to unjynx it!",
      subject: "Task Reminder",
    },
    telegram: {
      text: "Hey {user_name}! '{task_title}' is due {due_time}. Time to unjynx it!",
      markdown: "Hey *{user_name}*\\! '_{task_title}_' is due *{due_time}*\\. Time to unjynx it\\!",
    },
    email: {
      text: "Hey {user_name}! '{task_title}' is due {due_time}. Time to unjynx it!",
      subject: "Reminder: {task_title}",
      html: htmlWrap(`<h2 style="color:${PURPLE};margin:0 0 12px;">Task Reminder</h2><p>Hey <strong>{user_name}</strong>!</p><p><span style="color:${GOLD};font-weight:600;">{task_title}</span> is due <strong>{due_time}</strong>.</p><p>Time to unjynx it!</p>`),
    },
    sms: {
      text: "{user_name}: '{task_title}' due {due_time}. Unjynx it!",
    },
    slack: {
      text: "Hey {user_name}! '{task_title}' is due {due_time}. Time to unjynx it!",
      slackBlocks: [
        { type: "section", text: { type: "mrkdwn", text: "Hey *{user_name}*! :bell: *{task_title}* is due *{due_time}*.\nTime to unjynx it!" } },
      ],
    },
    discord: {
      text: "Hey {user_name}! '{task_title}' is due {due_time}. Time to unjynx it!",
      discordEmbed: {
        title: "Task Reminder",
        description: "Hey **{user_name}**! **{task_title}** is due **{due_time}**.\nTime to unjynx it!",
        color: 0x6B21A8,
      },
    },
  },

  overdue_alert: {
    push: {
      text: "'{task_title}' is overdue. Don't let it slip!",
      subject: "Overdue Task",
    },
    telegram: {
      text: "'{task_title}' is overdue. Don't let it slip!",
      markdown: "'_{task_title}_' is *overdue*\\. Don't let it slip\\!",
    },
    email: {
      text: "'{task_title}' is overdue. Don't let it slip!",
      subject: "Overdue: {task_title}",
      html: htmlWrap(`<h2 style="color:#DC2626;margin:0 0 12px;">Overdue Alert</h2><p><span style="color:${GOLD};font-weight:600;">{task_title}</span> is <strong style="color:#DC2626;">overdue</strong>.</p><p>Don't let it slip!</p>`),
    },
    sms: {
      text: "'{task_title}' is overdue. Don't let it slip!",
    },
    slack: {
      text: "'{task_title}' is overdue. Don't let it slip!",
      slackBlocks: [
        { type: "section", text: { type: "mrkdwn", text: ":warning: *{task_title}* is *overdue*. Don't let it slip!" } },
      ],
    },
    discord: {
      text: "'{task_title}' is overdue. Don't let it slip!",
      discordEmbed: {
        title: "Overdue Alert",
        description: "**{task_title}** is **overdue**. Don't let it slip!",
        color: 0xDC2626,
      },
    },
  },

  streak_nudge: {
    push: {
      text: "You're on a {streak_count}-day streak! Keep it going.",
      subject: "Streak Nudge",
    },
    telegram: {
      text: "You're on a {streak_count}-day streak! Keep it going.",
      markdown: "You're on a *{streak_count}\\-day streak*\\! Keep it going\\.",
    },
    email: {
      text: "You're on a {streak_count}-day streak! Keep it going.",
      subject: "{streak_count}-Day Streak!",
      html: htmlWrap(`<h2 style="color:${GOLD};margin:0 0 12px;">Streak Update</h2><p>You're on a <strong style="color:${GOLD};">{streak_count}-day streak</strong>!</p><p>Keep it going.</p>`),
    },
    sms: {
      text: "{streak_count}-day streak! Keep it going.",
    },
    slack: {
      text: "You're on a {streak_count}-day streak! Keep it going.",
      slackBlocks: [
        { type: "section", text: { type: "mrkdwn", text: ":fire: You're on a *{streak_count}-day streak*! Keep it going." } },
      ],
    },
    discord: {
      text: "You're on a {streak_count}-day streak! Keep it going.",
      discordEmbed: {
        title: "Streak Nudge",
        description: "You're on a **{streak_count}-day streak**! Keep it going.",
        color: 0xD4AF37,
      },
    },
  },

  daily_digest: {
    push: {
      text: "Here's your daily digest. You have tasks waiting for you!",
      subject: "Daily Digest",
    },
    telegram: {
      text: "Here's your daily digest. You have tasks waiting for you!",
      markdown: "Here's your *daily digest*\\. You have tasks waiting for you\\!",
    },
    email: {
      text: "Here's your daily digest. You have tasks waiting for you!",
      subject: "Your UNJYNX Daily Digest",
      html: htmlWrap(`<h2 style="color:${PURPLE};margin:0 0 12px;">Daily Digest</h2><p>Here's your daily digest. You have tasks waiting for you!</p>`),
    },
    sms: {
      text: "UNJYNX digest: Tasks waiting for you!",
    },
    slack: {
      text: "Here's your daily digest. You have tasks waiting for you!",
      slackBlocks: [
        { type: "section", text: { type: "mrkdwn", text: ":clipboard: Here's your *daily digest*. You have tasks waiting for you!" } },
      ],
    },
    discord: {
      text: "Here's your daily digest. You have tasks waiting for you!",
      discordEmbed: {
        title: "Daily Digest",
        description: "Here's your daily digest. You have tasks waiting for you!",
        color: 0x6B21A8,
      },
    },
  },

  daily_content: {
    push: {
      text: "{content_quote} — {content_author}",
      subject: "Daily Inspiration",
    },
    telegram: {
      text: "{content_quote} — {content_author}",
      markdown: "_{content_quote}_\n\n— *{content_author}*",
    },
    email: {
      text: "{content_quote} — {content_author}",
      subject: "Daily Inspiration from UNJYNX",
      html: htmlWrap(`<blockquote style="border-left:4px solid ${GOLD};padding:12px 16px;margin:0 0 12px;font-style:italic;color:#374151;">{content_quote}</blockquote><p style="text-align:right;color:${PURPLE};font-weight:600;">— {content_author}</p>`),
    },
    sms: {
      text: '"{content_quote}" - {content_author}',
    },
    slack: {
      text: "{content_quote} — {content_author}",
      slackBlocks: [
        { type: "section", text: { type: "mrkdwn", text: "> _{content_quote}_\n> — *{content_author}*" } },
      ],
    },
    discord: {
      text: "{content_quote} — {content_author}",
      discordEmbed: {
        title: "Daily Inspiration",
        description: "> {content_quote}\n\n— **{content_author}**",
        color: 0xD4AF37,
      },
    },
  },
};

/** Default fallback channel when a specific channel template is missing */
export const DEFAULT_CHANNEL = "push";
