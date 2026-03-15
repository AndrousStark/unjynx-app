const fs = require('fs');
const path = require('path');

// Read research JSON files (absolute paths)
const homeDir = process.env.USERPROFILE || process.env.HOME;
const baseDir = path.join(homeDir, '.claude/projects/C--Users-SaveLIFE-Foundation-Downloads-personal-Project--TODO-Reminder-app/cc286bef-7986-43bb-b8e5-6b3ce8edfe3c/tool-results');
const syncJson = JSON.parse(fs.readFileSync(
  path.join(baseDir, 'toolu_01KwQk63eHsnBSVggdJ3pBnE.json'),
  'utf-8'
));
const adminJson = JSON.parse(fs.readFileSync(
  path.join(baseDir, 'toolu_01Uri7x5S6jEh7jm65xtjboi.json'),
  'utf-8'
));

const syncContent = syncJson[0].text;
const adminContent = adminJson[0].text;

// Content management workflow
const contentWorkflow = `
================================================================================
  MISSING SYSTEM: CONTENT MANAGEMENT WORKFLOW
================================================================================

  Content management for daily quotes/wisdom across 60+ categories.
  v1 approach: Developer-curated, seeded via scripts, no CMS needed.

  v1 STRATEGY (Manual Curation):
    - Developer creates content JSON files per category
    - Node.js seed script inserts into PostgreSQL daily_content table
    - Minimum: 365 entries per category (1 year without repeats)
    - Format per entry: { title, body, author, source_url, category_id }
    - Seeding: scripts/seed-content.ts reads JSON, bulk inserts via Drizzle
    - Rotation: Server picks daily content using weighted random algorithm
      (see Content Rotation Algorithm in Phase 2 expansion)

  CONTENT SOURCE STRATEGY (v1):
    - Public domain quotes: Project Gutenberg, Wikiquote, OpenQuotes API
    - Creative Commons content: curated from CC-BY sources
    - Original content: written by developer (growth mindset, productivity tips)
    - Attribution: always stored (author + source URL)
    - NO copyrighted content (no book excerpts without permission)

  10 CATEGORIES (v1 — 300+ entries each):
    1. Motivation & Growth Mindset
    2. Stoic Philosophy (Marcus Aurelius, Seneca, Epictetus)
    3. Mahabharata Wisdom (public domain translations)
    4. Stan Lee Quotes (fair use — short quotes with attribution)
    5. Greek Mythology & Odysseus
    6. Productivity Science (research-backed tips)
    7. Sports Legends (motivational moments)
    8. Music & Creativity
    9. Anime & Manga Wisdom (popular series quotes)
    10. Personality Development

  SEED FILE FORMAT (per category):
    File: scripts/content/motivation.json
    Structure:
      [
        {
          "title": "The obstacle is the way",
          "body": "The impediment to action advances action. What stands in the way becomes the way.",
          "author": "Marcus Aurelius",
          "sourceUrl": "https://en.wikiquote.org/wiki/Marcus_Aurelius",
          "tags": ["stoic", "obstacle", "growth"]
        },
        ...
      ]

  SEED SCRIPT (scripts/seed-content.ts):
    1. Read all JSON files from scripts/content/
    2. For each file: map category name to category_id
    3. Batch insert via Drizzle (chunks of 100)
    4. Set scheduledDate: distribute evenly across 365 days
    5. Log: "Seeded {count} entries for {category}"
    6. Idempotent: skip existing entries (upsert on title+category)

  DAILY CONTENT DELIVERY:
    - BullMQ cron job: runs at midnight UTC
    - Per user: creates delayed job at their preferred delivery time
    - Selects content based on user's enabled categories
    - Rotation algorithm: weighted random (new > old, diverse categories)
    - Delivery: in-app card + optional channel (Telegram/WhatsApp/Email)

  MODERATION (v1 — minimal):
    - All content pre-approved by developer (no user-submitted content in v1)
    - Admin panel (P2 screen): view/edit/disable content entries
    - Flag system: users can report inappropriate content → admin reviews
    - Automated: profanity filter on content body (simple regex, not ML)

  v2 EXPANSION (future):
    - Admin CMS with approval workflow (draft → review → approved → published)
    - User-submitted quotes (moderation queue)
    - AI-generated daily summaries (Claude Haiku)
    - A/B testing content effectiveness (engagement tracking)
    - Community voting on content (surface popular quotes)

  DATABASE:
    Uses existing tables: content_categories, daily_content, user_content_preferences
    (defined in Database Schema Reference section)

  TESTS:
    - Unit: 4 (seed script parsing, rotation algorithm, delivery scheduling, duplicate prevention)
    - Integration: 2 (full seed → deliver flow, category filtering)
`;

// Build the final expansion
const header = `

################################################################################
################################################################################
  PART IV — COMPLETE SELF-CONTAINED REFERENCE
################################################################################
################################################################################

  This section inlines ALL implementation knowledge from companion documents,
  making this phase plan fully self-contained. After this addition, no external
  .doc files are needed — only app-structure/README.md remains as the UI/UX
  source of truth.

  Sections:
    H. Offline Sync Edge Cases (conflict matrix, soft delete, team sync)
    I. Admin Panel UI Specification (React + Refine)
    J. Analytics Strategy (business, product, technical, channel metrics)
    K. Notification Delivery SLA & Retry Cascade
    L. Content Management Workflow

`;

let output = header;
output += '\n\n================================================================================\n';
output += '  H. OFFLINE SYNC EDGE CASES SPECIFICATION\n';
output += '================================================================================\n\n';
output += syncContent;
output += '\n\n';
output += '\n\n================================================================================\n';
output += '  I-J-K. ADMIN PANEL + ANALYTICS + NOTIFICATION DELIVERY SLA\n';
output += '================================================================================\n\n';
output += adminContent;
output += '\n\n';
output += contentWorkflow;

const outFile = path.join(__dirname, 'EXPANSION-SYSTEMS.doc');
fs.writeFileSync(outFile, output, 'utf-8');
console.log('EXPANSION-SYSTEMS.doc written. Lines:', output.split('\n').length);
