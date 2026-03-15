import type { RenderedMessage } from "../channels/channel-adapter.interface.js";
import { TEMPLATES, DEFAULT_CHANNEL } from "./templates.js";

// ── Template Engine ──────────────────────────────────────────────────
// Substitutes {var_name} placeholders with provided values and returns
// a RenderedMessage ready for any channel adapter.

export interface TemplateVars {
  readonly task_title?: string;
  readonly due_time?: string;
  readonly project_name?: string;
  readonly streak_count?: string;
  readonly content_quote?: string;
  readonly content_author?: string;
  readonly user_name?: string;
  readonly [key: string]: string | undefined;
}

const PLACEHOLDER_RE = /\{(\w+)\}/g;

function interpolate(
  template: string,
  vars: TemplateVars,
): string {
  return template.replace(PLACEHOLDER_RE, (_match, key: string) => {
    return vars[key] ?? `{${key}}`;
  });
}

function interpolateBlocks(
  blocks: readonly unknown[],
  vars: TemplateVars,
): unknown[] {
  // Deep-clone and interpolate all string values
  const json = JSON.stringify(blocks);
  const interpolated = json.replace(PLACEHOLDER_RE, (_match, key: string) => {
    return vars[key] ?? `{${key}}`;
  });
  return JSON.parse(interpolated) as unknown[];
}

function interpolateEmbed(
  embed: unknown,
  vars: TemplateVars,
): unknown {
  const json = JSON.stringify(embed);
  const interpolated = json.replace(PLACEHOLDER_RE, (_match, key: string) => {
    return vars[key] ?? `{${key}}`;
  });
  return JSON.parse(interpolated) as unknown;
}

export function renderTemplate(
  channel: string,
  messageType: string,
  vars: TemplateVars,
): RenderedMessage {
  const messageTemplates = TEMPLATES[messageType];

  if (!messageTemplates) {
    return {
      text: `[Unknown message type: ${messageType}]`,
    };
  }

  // Fall back to default channel if no channel-specific template exists
  const template = messageTemplates[channel] ?? messageTemplates[DEFAULT_CHANNEL];

  if (!template) {
    return {
      text: `[No template for ${messageType}/${channel}]`,
    };
  }

  const result: {
    text: string;
    subject?: string;
    html?: string;
    markdown?: string;
    blocks?: unknown[];
    embed?: unknown;
  } = {
    text: interpolate(template.text, vars),
  };

  if (template.subject) {
    result.subject = interpolate(template.subject, vars);
  }

  if (template.html) {
    result.html = interpolate(template.html, vars);
  }

  if (template.markdown) {
    result.markdown = interpolate(template.markdown, vars);
  }

  if (template.slackBlocks) {
    result.blocks = interpolateBlocks(template.slackBlocks, vars);
  }

  if (template.discordEmbed) {
    result.embed = interpolateEmbed(template.discordEmbed, vars);
  }

  return result;
}
