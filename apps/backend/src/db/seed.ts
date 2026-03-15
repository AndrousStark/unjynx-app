/**
 * UNJYNX Database Seed Script
 *
 * Seeds the PostgreSQL database with:
 * - 100 daily content entries (10 per category)
 * - 5 system task templates
 * - 1 test user with 20 sample tasks across 3 projects
 *
 * Usage: tsx src/db/seed.ts
 *
 * Idempotent: Uses onConflictDoNothing() so re-running is safe.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pino from "pino";
import * as schema from "./schema/index.js";

const logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true } },
});

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  logger.info("Connecting to database for seeding...");
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  const start = Date.now();

  // ── 1. Seed Daily Content (100 entries: 10 per category) ────────────

  logger.info("Seeding daily content...");

  const contentCategories = [
    "stoic_wisdom",
    "ancient_indian",
    "growth_mindset",
    "dark_humor",
    "anime",
    "gratitude",
    "warrior_discipline",
    "poetry",
    "productivity_hacks",
    "comeback_stories",
  ] as const;

  const contentEntries: schema.NewDailyContentItem[] = [
    // Stoic Wisdom
    { category: "stoic_wisdom", content: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", source: "Meditations" },
    { category: "stoic_wisdom", content: "We suffer more often in imagination than in reality.", author: "Seneca", source: "Letters from a Stoic" },
    { category: "stoic_wisdom", content: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", source: "Meditations" },
    { category: "stoic_wisdom", content: "No man is free who is not master of himself.", author: "Epictetus", source: "Discourses" },
    { category: "stoic_wisdom", content: "The obstacle is the way.", author: "Marcus Aurelius", source: "Meditations" },
    { category: "stoic_wisdom", content: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations" },
    { category: "stoic_wisdom", content: "He who fears death will never do anything worthy of a living man.", author: "Seneca", source: "Letters" },
    { category: "stoic_wisdom", content: "First say to yourself what you would be; then do what you have to do.", author: "Epictetus", source: "Discourses" },
    { category: "stoic_wisdom", content: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", source: "Meditations" },
    { category: "stoic_wisdom", content: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", source: "Letters" },

    // Ancient Indian Wisdom
    { category: "ancient_indian", content: "You have the right to work, but never to the fruit of work.", author: "Krishna", source: "Bhagavad Gita 2.47" },
    { category: "ancient_indian", content: "The mind acts like an enemy for those who do not control it.", author: "Krishna", source: "Bhagavad Gita 6.6" },
    { category: "ancient_indian", content: "There is nothing lost or wasted in this life.", author: "Krishna", source: "Bhagavad Gita 6.40" },
    { category: "ancient_indian", content: "Set your heart upon your work but never its reward.", author: "Krishna", source: "Bhagavad Gita 2.47" },
    { category: "ancient_indian", content: "The soul is neither born, nor does it die.", author: "Krishna", source: "Bhagavad Gita 2.20" },
    { category: "ancient_indian", content: "An ounce of practice is worth more than tons of preaching.", author: "Mahatma Gandhi", source: "My Experiments with Truth" },
    { category: "ancient_indian", content: "When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place.", author: "Krishna", source: "Bhagavad Gita 6.19" },
    { category: "ancient_indian", content: "Whatever happened, happened for the good. Whatever is happening, is happening for the good.", author: "Krishna", source: "Bhagavad Gita" },
    { category: "ancient_indian", content: "Yoga is the journey of the self, through the self, to the self.", author: "Krishna", source: "Bhagavad Gita 6.20" },
    { category: "ancient_indian", content: "There is no knowledge equal to knowledge of the self.", author: "Chanakya", source: "Arthashastra" },

    // Growth Mindset
    { category: "growth_mindset", content: "Becoming is better than being.", author: "Carol Dweck", source: "Mindset" },
    { category: "growth_mindset", content: "The view you adopt for yourself profoundly affects the way you lead your life.", author: "Carol Dweck", source: "Mindset" },
    { category: "growth_mindset", content: "I have not failed. I have just found 10,000 ways that won't work.", author: "Thomas Edison", source: null },
    { category: "growth_mindset", content: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein", source: null },
    { category: "growth_mindset", content: "The only way to do great work is to love what you do.", author: "Steve Jobs", source: "Stanford Commencement" },
    { category: "growth_mindset", content: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", source: null },
    { category: "growth_mindset", content: "Fall seven times, stand up eight.", author: "Japanese Proverb", source: null },
    { category: "growth_mindset", content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", source: null },
    { category: "growth_mindset", content: "The mind is everything. What you think you become.", author: "Buddha", source: "Dhammapada" },
    { category: "growth_mindset", content: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar", source: null },

    // Dark Humor & Anti-Motivation
    { category: "dark_humor", content: "The light at the end of the tunnel has been turned off due to budget cuts.", author: "Unknown", source: null },
    { category: "dark_humor", content: "Remember, you're unique. Just like everyone else.", author: "Unknown", source: null },
    { category: "dark_humor", content: "Hard work pays off eventually. Laziness pays off now.", author: "Unknown", source: null },
    { category: "dark_humor", content: "If at first you don't succeed, then skydiving definitely isn't for you.", author: "Steven Wright", source: null },
    { category: "dark_humor", content: "The early bird gets the worm, but the second mouse gets the cheese.", author: "Steven Wright", source: null },
    { category: "dark_humor", content: "Opportunity does not knock, it presents itself when you beat down the door.", author: "Kyle Chandler", source: null },
    { category: "dark_humor", content: "Behind every great man is a woman rolling her eyes.", author: "Jim Carrey", source: null },
    { category: "dark_humor", content: "People say nothing is impossible, but I do nothing every day.", author: "A.A. Milne", source: "Winnie the Pooh" },
    { category: "dark_humor", content: "Age is of no importance unless you're a cheese.", author: "Billie Burke", source: null },
    { category: "dark_humor", content: "I am so clever that sometimes I don't understand a single word of what I am saying.", author: "Oscar Wilde", source: null },

    // Anime & Pop Culture
    { category: "anime", content: "Believe in the me that believes in you!", author: "Kamina", source: "Gurren Lagann" },
    { category: "anime", content: "A lesson without pain is meaningless.", author: "Edward Elric", source: "Fullmetal Alchemist" },
    { category: "anime", content: "I don't want to conquer anything. I just think the guy with the most freedom is the Pirate King.", author: "Monkey D. Luffy", source: "One Piece" },
    { category: "anime", content: "Power comes in response to a need, not a desire.", author: "Goku", source: "Dragon Ball Z" },
    { category: "anime", content: "The world isn't perfect. But it's there for us, doing the best it can.", author: "Roy Mustang", source: "Fullmetal Alchemist" },
    { category: "anime", content: "Hard work is worthless for those that don't believe in themselves.", author: "Naruto Uzumaki", source: "Naruto" },
    { category: "anime", content: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", author: "Kenshin Himura", source: "Rurouni Kenshin" },
    { category: "anime", content: "With great power comes great responsibility.", author: "Uncle Ben", source: "Spider-Man" },
    { category: "anime", content: "It does not do to dwell on dreams and forget to live.", author: "Albus Dumbledore", source: "Harry Potter" },
    { category: "anime", content: "Excelsior!", author: "Stan Lee", source: null },

    // Gratitude & Mindfulness
    { category: "gratitude", content: "Gratitude is not only the greatest of virtues but the parent of all others.", author: "Cicero", source: null },
    { category: "gratitude", content: "When you arise in the morning, think of what a precious privilege it is to be alive.", author: "Marcus Aurelius", source: "Meditations" },
    { category: "gratitude", content: "Be present in all things and thankful for all things.", author: "Maya Angelou", source: null },
    { category: "gratitude", content: "The root of joy is gratefulness.", author: "David Steindl-Rast", source: null },
    { category: "gratitude", content: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", source: null },
    { category: "gratitude", content: "If you want to find happiness, find gratitude.", author: "Steve Maraboli", source: null },
    { category: "gratitude", content: "Enjoy the little things, for one day you may look back and realize they were the big things.", author: "Robert Brault", source: null },
    { category: "gratitude", content: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh", source: null },
    { category: "gratitude", content: "Gratitude turns what we have into enough.", author: "Melody Beattie", source: null },
    { category: "gratitude", content: "Let us be grateful to people who make us happy.", author: "Marcel Proust", source: null },

    // Warrior Discipline
    { category: "warrior_discipline", content: "A warrior is not about perfection. It is about absolute vulnerability.", author: "Chogyam Trungpa", source: "Shambhala" },
    { category: "warrior_discipline", content: "The more you sweat in training, the less you bleed in combat.", author: "Richard Marcinko", source: null },
    { category: "warrior_discipline", content: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", source: null },
    { category: "warrior_discipline", content: "The only easy day was yesterday.", author: "US Navy SEALs", source: null },
    { category: "warrior_discipline", content: "What we do in life echoes in eternity.", author: "Maximus", source: "Gladiator" },
    { category: "warrior_discipline", content: "I fear not the man who has practiced 10,000 kicks once. I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee", source: null },
    { category: "warrior_discipline", content: "Victorious warriors win first and then go to war.", author: "Sun Tzu", source: "The Art of War" },
    { category: "warrior_discipline", content: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong", source: null },
    { category: "warrior_discipline", content: "The world breaks everyone, and afterward, many are strong at the broken places.", author: "Ernest Hemingway", source: "A Farewell to Arms" },
    { category: "warrior_discipline", content: "Be water, my friend.", author: "Bruce Lee", source: null },

    // Poetic Wisdom
    { category: "poetry", content: "Two roads diverged in a wood, and I — I took the one less traveled by, and that has made all the difference.", author: "Robert Frost", source: "The Road Not Taken" },
    { category: "poetry", content: "Do not go gentle into that good night. Rage, rage against the dying of the light.", author: "Dylan Thomas", source: null },
    { category: "poetry", content: "I am the master of my fate, I am the captain of my soul.", author: "William Ernest Henley", source: "Invictus" },
    { category: "poetry", content: "If you can keep your head when all about you are losing theirs, you'll be a Man, my son!", author: "Rudyard Kipling", source: "If—" },
    { category: "poetry", content: "We are such stuff as dreams are made on, and our little life is rounded with a sleep.", author: "William Shakespeare", source: "The Tempest" },
    { category: "poetry", content: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson", source: null },
    { category: "poetry", content: "Still I Rise.", author: "Maya Angelou", source: null },
    { category: "poetry", content: "Not all those who wander are lost.", author: "J.R.R. Tolkien", source: "The Fellowship of the Ring" },
    { category: "poetry", content: "Out of the night that covers me, black as the pit from pole to pole, I thank whatever gods may be for my unconquerable soul.", author: "William Ernest Henley", source: "Invictus" },
    { category: "poetry", content: "The best way out is always through.", author: "Robert Frost", source: null },

    // Productivity Hacks
    { category: "productivity_hacks", content: "Eat the frog first thing in the morning — do your hardest task when your willpower is highest.", author: "Brian Tracy", source: "Eat That Frog" },
    { category: "productivity_hacks", content: "The two-minute rule: if it takes less than two minutes, do it now.", author: "David Allen", source: "Getting Things Done" },
    { category: "productivity_hacks", content: "Time blocking is the antidote to shallow work. Give every hour a job.", author: "Cal Newport", source: "Deep Work" },
    { category: "productivity_hacks", content: "Your brain is for having ideas, not holding them.", author: "David Allen", source: "Getting Things Done" },
    { category: "productivity_hacks", content: "Batch similar tasks together. Context switching costs 23 minutes per switch.", author: "Gloria Mark", source: "UC Irvine Research" },
    { category: "productivity_hacks", content: "The Pareto Principle: 80% of results come from 20% of efforts. Find your 20%.", author: "Vilfredo Pareto", source: null },
    { category: "productivity_hacks", content: "Start before you're ready. Perfectionism is procrastination in disguise.", author: "Steven Pressfield", source: "The War of Art" },
    { category: "productivity_hacks", content: "Energy management is more important than time management. Match tasks to your energy.", author: "Tony Schwartz", source: "The Power of Full Engagement" },
    { category: "productivity_hacks", content: "Break big tasks into sub-tasks no longer than 30 minutes each.", author: "Unknown", source: null },
    { category: "productivity_hacks", content: "The Pomodoro Technique: 25 minutes focus + 5 minutes rest. Rinse and repeat.", author: "Francesco Cirillo", source: null },

    // Comeback Stories
    { category: "comeback_stories", content: "I was fired from my own company. Then I came back and built something even bigger.", author: "Steve Jobs", source: "Apple" },
    { category: "comeback_stories", content: "I failed the university entrance exam twice. I was rejected by 30 companies. I kept going.", author: "Jack Ma", source: "Alibaba" },
    { category: "comeback_stories", content: "I was cut from my high school basketball team. I went home, locked myself in my room and cried.", author: "Michael Jordan", source: null },
    { category: "comeback_stories", content: "I lived on $1 a day as a child. I knew poverty was not my destiny.", author: "Oprah Winfrey", source: null },
    { category: "comeback_stories", content: "I was sleeping in my car and showering at the YMCA. I never stopped believing.", author: "Chris Gardner", source: "The Pursuit of Happyness" },
    { category: "comeback_stories", content: "I was rejected 12 times before someone published my first Harry Potter book.", author: "J.K. Rowling", source: null },
    { category: "comeback_stories", content: "I was bankrupt at 31. By 40, I was the richest man in my industry.", author: "Walt Disney", source: null },
    { category: "comeback_stories", content: "I was born into apartheid. I spent 27 years in prison. Then I became president.", author: "Nelson Mandela", source: null },
    { category: "comeback_stories", content: "I was told I would never walk again. I won 8 Olympic gold medals.", author: "Wilma Rudolph", source: null },
    { category: "comeback_stories", content: "I dropped out of college and started a company in my garage.", author: "Bill Gates", source: "Microsoft" },
  ];

  await db
    .insert(schema.dailyContent)
    .values(contentEntries)
    .onConflictDoNothing();

  logger.info({ count: contentEntries.length }, "Daily content seeded");

  // ── 2. Seed System Task Templates (5 templates) ──────────────────────

  logger.info("Seeding task templates...");

  const templates: schema.NewTaskTemplate[] = [
    {
      title: "Weekly Review",
      description: "David Allen's weekly review checklist for GTD practitioners",
      category: "productivity",
      isGlobal: true,
      priority: "medium",
      subtasks: JSON.stringify([
        "Collect all loose papers and materials",
        "Process inbox to zero",
        "Review previous calendar (2 weeks back)",
        "Review upcoming calendar (2 weeks forward)",
        "Review waiting-for list",
        "Review project list — any new next actions?",
        "Review someday/maybe list",
        "Be creative — any new projects or ideas?",
      ]),
    },
    {
      title: "Morning Routine",
      description: "Structured morning routine for peak productivity",
      category: "wellness",
      isGlobal: true,
      priority: "high",
      subtasks: JSON.stringify([
        "Hydrate — drink 500ml water",
        "10 minutes meditation or breathing",
        "Review today's top 3 priorities",
        "Quick exercise (stretching, pushups, walk)",
        "Journal — gratitude + intention",
      ]),
    },
    {
      title: "Meeting Preparation",
      description: "Ensure every meeting is well-prepared and productive",
      category: "professional",
      isGlobal: true,
      priority: "high",
      subtasks: JSON.stringify([
        "Review meeting agenda and objectives",
        "Prepare any required documents or slides",
        "List 3 key points to communicate",
        "Prepare questions for discussion",
        "Set up tech (camera, mic, screen share)",
        "Send pre-read materials if applicable",
      ]),
    },
    {
      title: "Bug Fix Workflow",
      description: "Systematic approach to debugging and fixing software issues",
      category: "development",
      isGlobal: true,
      priority: "high",
      subtasks: JSON.stringify([
        "Reproduce the bug reliably",
        "Check error logs and stack traces",
        "Identify root cause (not just symptoms)",
        "Write a failing test that exposes the bug",
        "Implement the fix",
        "Verify the test passes",
        "Test edge cases and regression",
        "Update documentation if applicable",
        "Create PR with clear description",
      ]),
    },
    {
      title: "Project Kickoff",
      description: "Structured checklist for starting a new project or feature",
      category: "professional",
      isGlobal: true,
      priority: "medium",
      subtasks: JSON.stringify([
        "Define clear objectives and success criteria",
        "Identify stakeholders and RACI",
        "Break down into milestones (2-week chunks)",
        "Identify risks and mitigation strategies",
        "Set up project board (Kanban or list)",
        "Schedule kickoff meeting",
        "Create initial backlog of tasks",
        "Define communication cadence",
      ]),
    },
  ];

  await db
    .insert(schema.taskTemplates)
    .values(templates)
    .onConflictDoNothing();

  logger.info({ count: templates.length }, "Task templates seeded");

  // ── 3. Seed Test User + 20 Tasks + 3 Projects ────────────────────────

  logger.info("Seeding test user, projects, and tasks...");

  // Test user profile
  const [testUser] = await db
    .insert(schema.profiles)
    .values({
      logtoId: "test-user-001",
      email: "test@unjynx.dev",
      name: "Test User",
      timezone: "Asia/Kolkata",
    })
    .onConflictDoNothing()
    .returning();

  if (testUser) {
    const userId = testUser.id;

    // 3 Projects
    const projectData: schema.NewProject[] = [
      { userId, name: "UNJYNX Development", color: "#6C5CE7", icon: "code" },
      { userId, name: "Personal Health", color: "#00B894", icon: "fitness_center" },
      { userId, name: "Learning & Growth", color: "#FDCB6E", icon: "school" },
    ];

    const projects = await db
      .insert(schema.projects)
      .values(projectData)
      .onConflictDoNothing()
      .returning();

    if (projects.length > 0) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86_400_000);
      const nextWeek = new Date(now.getTime() + 7 * 86_400_000);
      const yesterday = new Date(now.getTime() - 86_400_000);

      const taskData: schema.NewTask[] = [
        // Development project (8 tasks)
        { userId, projectId: projects[0].id, title: "Implement auth callback endpoint", priority: "high", dueDate: now, status: "completed", completedAt: now },
        { userId, projectId: projects[0].id, title: "Add idempotency middleware", priority: "high", dueDate: now, status: "completed", completedAt: now },
        { userId, projectId: projects[0].id, title: "Set up PostgreSQL full-text search", priority: "medium", dueDate: tomorrow },
        { userId, projectId: projects[0].id, title: "Write seed script for daily content", priority: "medium", dueDate: tomorrow },
        { userId, projectId: projects[0].id, title: "Build Flutter API client package", priority: "high", dueDate: nextWeek },
        { userId, projectId: projects[0].id, title: "Wire Pomodoro ambient sounds", priority: "low", dueDate: nextWeek },
        { userId, projectId: projects[0].id, title: "Run full integration test suite", priority: "medium", dueDate: nextWeek },
        { userId, projectId: projects[0].id, title: "Fix onboarding permission flow on Android 14", priority: "urgent", dueDate: yesterday, status: "pending" },

        // Health project (6 tasks)
        { userId, projectId: projects[1].id, title: "Morning run — 5km", priority: "high", rrule: "FREQ=DAILY;BYDAY=MO,WE,FR" },
        { userId, projectId: projects[1].id, title: "Meal prep for the week", priority: "medium", dueDate: tomorrow },
        { userId, projectId: projects[1].id, title: "Schedule annual health checkup", priority: "low", dueDate: nextWeek },
        { userId, projectId: projects[1].id, title: "Meditate 10 minutes", priority: "medium", rrule: "FREQ=DAILY" },
        { userId, projectId: projects[1].id, title: "Track water intake — 3L goal", priority: "low", rrule: "FREQ=DAILY" },
        { userId, projectId: projects[1].id, title: "Sleep by 11 PM tonight", priority: "high", dueDate: now },

        // Learning project (6 tasks)
        { userId, projectId: projects[2].id, title: "Read 30 pages of Deep Work", priority: "medium", dueDate: tomorrow },
        { userId, projectId: projects[2].id, title: "Complete Dart advanced patterns course", priority: "low", dueDate: nextWeek },
        { userId, projectId: projects[2].id, title: "Practice LeetCode — 2 medium problems", priority: "medium", dueDate: now },
        { userId, projectId: projects[2].id, title: "Write blog post about CRDT sync", priority: "low", dueDate: nextWeek },
        { userId, projectId: projects[2].id, title: "Review system design interview notes", priority: "high", dueDate: tomorrow },
        { userId, projectId: projects[2].id, title: "Watch Flutter Forward 2026 keynote", priority: "low" },
      ];

      await db.insert(schema.tasks).values(taskData).onConflictDoNothing();

      logger.info(
        { tasks: taskData.length, projects: projects.length },
        "Test user data seeded",
      );
    }
  } else {
    logger.info("Test user already exists, skipping task seeding");
  }

  // ── Done ──────────────────────────────────────────────────────────────

  logger.info(
    { durationMs: Date.now() - start },
    "Seed complete!",
  );

  await client.end();
  process.exit(0);
}

seed().catch((error) => {
  logger.error({ err: error }, "Seed failed");
  process.exit(1);
});
