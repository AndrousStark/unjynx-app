/**
 * UNJYNX Database Seed Script
 *
 * Seeds the PostgreSQL database with:
 * - 190 daily content entries (10 per category, 19 categories)
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
    "tech_wisdom",
    "financial_literacy",
    "health_wellness",
    "leadership",
    "creativity",
    "relationships",
    "science",
    "philosophy",
    "sports",
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

    // Tech Wisdom
    { category: "tech_wisdom", content: "We can only see a short distance ahead, but we can see plenty there that needs to be done.", author: "Alan Turing", source: "Computing Machinery and Intelligence" },
    { category: "tech_wisdom", content: "The best way to predict the future is to invent it.", author: "Alan Kay", source: "Xerox PARC" },
    { category: "tech_wisdom", content: "Talk is cheap. Show me the code.", author: "Linus Torvalds", source: null },
    { category: "tech_wisdom", content: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", source: null },
    { category: "tech_wisdom", content: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson", source: "Structure and Interpretation of Computer Programs" },
    { category: "tech_wisdom", content: "The most important property of a program is whether it accomplishes the intention of its user.", author: "C.A.R. Hoare", source: null },
    { category: "tech_wisdom", content: "UNIX is simple. It just takes a genius to understand its simplicity.", author: "Dennis Ritchie", source: null },
    { category: "tech_wisdom", content: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler", source: "Refactoring" },
    { category: "tech_wisdom", content: "First, solve the problem. Then, write the code.", author: "John Johnson", source: null },
    { category: "tech_wisdom", content: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates", source: null },

    // Financial Literacy
    { category: "financial_literacy", content: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.", author: "Warren Buffett", source: null },
    { category: "financial_literacy", content: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett", source: null },
    { category: "financial_literacy", content: "It is not the man who has too little that is poor, but the one who hankers after more.", author: "Seneca", source: "Letters from a Stoic" },
    { category: "financial_literacy", content: "Spend each day trying to be a little wiser than you were when you woke up.", author: "Charlie Munger", source: "Poor Charlie's Almanack" },
    { category: "financial_literacy", content: "The individual investor should act consistently as an investor and not as a speculator.", author: "Benjamin Graham", source: "The Intelligent Investor" },
    { category: "financial_literacy", content: "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn't, pays it.", author: "Albert Einstein", source: null },
    { category: "financial_literacy", content: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett", source: null },
    { category: "financial_literacy", content: "The four most dangerous words in investing are: This time it's different.", author: "John Templeton", source: null },
    { category: "financial_literacy", content: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", source: null },
    { category: "financial_literacy", content: "Wide diversification is only required when investors do not understand what they are doing.", author: "Warren Buffett", source: null },

    // Health & Wellness
    { category: "health_wellness", content: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", source: null },
    { category: "health_wellness", content: "The greatest wealth is health.", author: "Virgil", source: null },
    { category: "health_wellness", content: "It is health that is real wealth and not pieces of gold and silver.", author: "Mahatma Gandhi", source: null },
    { category: "health_wellness", content: "Physical fitness is the first requisite of happiness.", author: "Joseph Pilates", source: "Return to Life Through Contrology" },
    { category: "health_wellness", content: "The doctor of the future will give no medicine, but will instruct his patients in care of the human frame, in diet, and in the cause and prevention of disease.", author: "Thomas Edison", source: null },
    { category: "health_wellness", content: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates", source: null },
    { category: "health_wellness", content: "A healthy outside starts from the inside.", author: "Robert Urich", source: null },
    { category: "health_wellness", content: "Sleep is the best meditation.", author: "Dalai Lama", source: null },
    { category: "health_wellness", content: "Walking is man's best medicine.", author: "Hippocrates", source: null },
    { category: "health_wellness", content: "The mind and body are not separate. What affects one, affects the other.", author: "Unknown", source: null },

    // Leadership
    { category: "leadership", content: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell", source: null },
    { category: "leadership", content: "Nearly all men can stand adversity, but if you want to test a man's character, give him power.", author: "Abraham Lincoln", source: null },
    { category: "leadership", content: "It is better to lead from behind and to put others in front, especially when you celebrate victory.", author: "Nelson Mandela", source: "Long Walk to Freedom" },
    { category: "leadership", content: "The task of leadership is not to put greatness into people, but to elicit it, for the greatness is there already.", author: "John Buchan", source: null },
    { category: "leadership", content: "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.", author: "Jack Welch", source: null },
    { category: "leadership", content: "The greatest leader is not the one who does the greatest things, but the one who gets people to do the greatest things.", author: "Ronald Reagan", source: null },
    { category: "leadership", content: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek", source: "Leaders Eat Last" },
    { category: "leadership", content: "A genuine leader is not a searcher for consensus but a molder of consensus.", author: "Martin Luther King Jr.", source: null },
    { category: "leadership", content: "The quality of a leader is reflected in the standards they set for themselves.", author: "Ray Kroc", source: null },
    { category: "leadership", content: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker", source: null },

    // Creativity
    { category: "creativity", content: "Creativity is intelligence having fun.", author: "Albert Einstein", source: null },
    { category: "creativity", content: "The chief enemy of creativity is good sense.", author: "Pablo Picasso", source: null },
    { category: "creativity", content: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso", source: null },
    { category: "creativity", content: "Creativity takes courage.", author: "Henri Matisse", source: null },
    { category: "creativity", content: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs", source: null },
    { category: "creativity", content: "Learn the rules like a pro, so you can break them like an artist.", author: "Pablo Picasso", source: null },
    { category: "creativity", content: "I have no special talents. I am only passionately curious.", author: "Albert Einstein", source: null },
    { category: "creativity", content: "The desire to create is one of the deepest yearnings of the human soul.", author: "Dieter F. Uchtdorf", source: null },
    { category: "creativity", content: "Art is not what you see, but what you make others see.", author: "Edgar Degas", source: null },
    { category: "creativity", content: "Imagination is the beginning of creation. You imagine what you desire, you will what you imagine, and at last you create what you will.", author: "George Bernard Shaw", source: null },

    // Relationships
    { category: "relationships", content: "The most important thing in communication is hearing what isn't said.", author: "Peter Drucker", source: null },
    { category: "relationships", content: "No road is long with good company.", author: "Turkish Proverb", source: null },
    { category: "relationships", content: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.", author: "Carl Jung", source: null },
    { category: "relationships", content: "We are most alive when we find the courage to be vulnerable and to let our true selves be seen.", author: "Brene Brown", source: "Daring Greatly" },
    { category: "relationships", content: "The quality of your life is the quality of your relationships.", author: "Tony Robbins", source: null },
    { category: "relationships", content: "When people talk, listen completely. Most people never listen.", author: "Ernest Hemingway", source: null },
    { category: "relationships", content: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl", source: "Man's Search for Meaning" },
    { category: "relationships", content: "Empathy is about finding echoes of another person in yourself.", author: "Mohsin Hamid", source: null },
    { category: "relationships", content: "The single biggest problem in communication is the illusion that it has taken place.", author: "George Bernard Shaw", source: null },
    { category: "relationships", content: "People will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou", source: null },

    // Science
    { category: "science", content: "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.", author: "Albert Einstein", source: null },
    { category: "science", content: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", source: null },
    { category: "science", content: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.", author: "Marie Curie", source: null },
    { category: "science", content: "I would rather have questions that can't be answered than answers that can't be questioned.", author: "Richard Feynman", source: null },
    { category: "science", content: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson", source: null },
    { category: "science", content: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan", source: null },
    { category: "science", content: "In science, there are no shortcuts to truth.", author: "Karl Popper", source: "The Logic of Scientific Discovery" },
    { category: "science", content: "If I have seen further, it is by standing on the shoulders of giants.", author: "Isaac Newton", source: "Letter to Robert Hooke" },
    { category: "science", content: "The saddest aspect of life right now is that science gathers knowledge faster than society gathers wisdom.", author: "Isaac Asimov", source: null },
    { category: "science", content: "We are just an advanced breed of monkeys on a minor planet of a very average star. But we can understand the Universe.", author: "Stephen Hawking", source: null },

    // Philosophy
    { category: "philosophy", content: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche", source: "Twilight of the Idols" },
    { category: "philosophy", content: "The unexamined life is not worth living.", author: "Socrates", source: "Apology" },
    { category: "philosophy", content: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.", author: "Jean-Paul Sartre", source: "Being and Nothingness" },
    { category: "philosophy", content: "One must imagine Sisyphus happy.", author: "Albert Camus", source: "The Myth of Sisyphus" },
    { category: "philosophy", content: "The only true wisdom is in knowing you know nothing.", author: "Socrates", source: null },
    { category: "philosophy", content: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche", source: null },
    { category: "philosophy", content: "Happiness is not an ideal of reason, but of imagination.", author: "Immanuel Kant", source: "Groundwork of the Metaphysics of Morals" },
    { category: "philosophy", content: "I think, therefore I am.", author: "Rene Descartes", source: "Discourse on the Method" },
    { category: "philosophy", content: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", source: null },
    { category: "philosophy", content: "We do not see things as they are, we see them as we are.", author: "Anais Nin", source: "Seduction of the Minotaur" },

    // Sports
    { category: "sports", content: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. Twenty-six times I've been trusted to take the game-winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan", source: null },
    { category: "sports", content: "Float like a butterfly, sting like a bee.", author: "Muhammad Ali", source: null },
    { category: "sports", content: "The more difficult the victory, the greater the happiness in winning.", author: "Pele", source: null },
    { category: "sports", content: "I can't relate to lazy people. We don't speak the same language.", author: "Kobe Bryant", source: null },
    { category: "sports", content: "Champions keep playing until they get it right.", author: "Billie Jean King", source: null },
    { category: "sports", content: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi", source: null },
    { category: "sports", content: "The harder the battle, the sweeter the victory.", author: "Les Brown", source: null },
    { category: "sports", content: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", source: null },
    { category: "sports", content: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali", source: null },
    { category: "sports", content: "The principle is competing against yourself. It's about self-improvement, about being better than you were the day before.", author: "Steve Young", source: null },
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

  // ── 4. Seed Industry Modes ─────────────────────────────────────────

  logger.info("Seeding industry modes...");

  // 4a. Insert modes
  const modeData: schema.NewIndustryMode[] = [
    {
      slug: "general",
      name: "General",
      description: "Default mode with standard terminology. Works for everyone.",
      icon: "dashboard",
      colorHex: "#6C5CE7",
      isActive: true,
      sortOrder: 0,
    },
    {
      slug: "hustle",
      name: "Hustle Mode",
      description: "Built for freelancers and solopreneurs. Track clients, invoices, and deliverables.",
      icon: "rocket_launch",
      colorHex: "#FF6B6B",
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: "closer",
      name: "Closer Mode",
      description: "Designed for sales teams and real estate agents. Pipeline-first thinking.",
      icon: "handshake",
      colorHex: "#00B894",
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: "grind",
      name: "Grind Mode",
      description: "Made for small businesses and retail. Daily ops, staff, and inventory.",
      icon: "storefront",
      colorHex: "#FDCB6E",
      isActive: true,
      sortOrder: 3,
    },
  ];

  const insertedModes = await db
    .insert(schema.industryModes)
    .values(modeData)
    .onConflictDoNothing()
    .returning();

  // If modes already exist, fetch them instead
  const allModes = insertedModes.length > 0
    ? insertedModes
    : await db.select().from(schema.industryModes);

  const modeMap = new Map(allModes.map((m) => [m.slug, m.id]));

  logger.info({ count: allModes.length }, "Industry modes seeded");

  // 4b. Seed vocabulary (General has no swaps)
  const vocabularyData: schema.NewModeVocabularyEntry[] = [];

  const hustleId = modeMap.get("hustle");
  if (hustleId) {
    const hustleVocab: Array<[string, string]> = [
      ["Task", "Deliverable"],
      ["Project", "Client"],
      ["Priority", "Urgency"],
      ["Deadline", "Due Date"],
      ["Complete", "Shipped"],
      ["In Progress", "Working On"],
      ["Tags", "Skills"],
      ["Section", "Phase"],
      ["Archive", "Completed Clients"],
      ["Kanban", "Client Board"],
      ["Calendar", "Schedule"],
      ["Progress", "Billing"],
      ["Home", "Dashboard"],
      ["Ghost Mode", "Deep Work"],
      ["Pomodoro", "Sprint"],
    ];
    for (const [original, translated] of hustleVocab) {
      vocabularyData.push({ modeId: hustleId, originalTerm: original, translatedTerm: translated });
    }
  }

  const closerId = modeMap.get("closer");
  if (closerId) {
    const closerVocab: Array<[string, string]> = [
      ["Task", "Follow-up"],
      ["Project", "Deal"],
      ["Priority", "Heat Score"],
      ["Deadline", "Close Date"],
      ["Complete", "Closed Won"],
      ["In Progress", "Negotiating"],
      ["Tags", "Lead Source"],
      ["Section", "Pipeline Stage"],
      ["Archive", "Closed Deals"],
      ["Kanban", "Pipeline"],
      ["Calendar", "Appointments"],
      ["Progress", "Revenue"],
      ["Home", "Pipeline View"],
      ["Ghost Mode", "Focused Selling"],
      ["Pomodoro", "Power Hour"],
    ];
    for (const [original, translated] of closerVocab) {
      vocabularyData.push({ modeId: closerId, originalTerm: original, translatedTerm: translated });
    }
  }

  const grindId = modeMap.get("grind");
  if (grindId) {
    const grindVocab: Array<[string, string]> = [
      ["Task", "To-Do"],
      ["Project", "Department"],
      ["Priority", "Urgency"],
      ["Deadline", "Due By"],
      ["Complete", "Done"],
      ["In Progress", "On It"],
      ["Tags", "Category"],
      ["Section", "Zone"],
      ["Archive", "Completed"],
      ["Kanban", "Task Board"],
      ["Calendar", "Roster"],
      ["Progress", "Operations"],
      ["Home", "HQ"],
      ["Ghost Mode", "Focus Time"],
      ["Pomodoro", "Work Block"],
    ];
    for (const [original, translated] of grindVocab) {
      vocabularyData.push({ modeId: grindId, originalTerm: original, translatedTerm: translated });
    }
  }

  if (vocabularyData.length > 0) {
    await db
      .insert(schema.modeVocabulary)
      .values(vocabularyData)
      .onConflictDoNothing();
  }

  logger.info({ count: vocabularyData.length }, "Mode vocabulary seeded");

  // 4c. Seed templates
  const templateData: schema.NewModeTemplate[] = [];

  const generalId = modeMap.get("general");
  if (generalId) {
    templateData.push(
      {
        modeId: generalId,
        name: "Daily Standup",
        description: "Quick daily check-in to align on priorities",
        subtasksJson: ["What did I accomplish yesterday?", "What will I work on today?", "Any blockers?"],
        category: "productivity",
        sortOrder: 0,
      },
      {
        modeId: generalId,
        name: "Weekly Review",
        description: "End-of-week reflection and planning",
        subtasksJson: ["Review completed tasks", "Move incomplete tasks forward", "Set top 3 priorities for next week"],
        category: "productivity",
        sortOrder: 1,
      },
      {
        modeId: generalId,
        name: "Sprint Planning",
        description: "Plan the next sprint or work cycle",
        subtasksJson: ["Review backlog", "Estimate effort for each item", "Assign tasks to team members", "Set sprint goal"],
        category: "productivity",
        sortOrder: 2,
      },
    );
  }

  if (hustleId) {
    templateData.push(
      {
        modeId: hustleId,
        name: "Client Onboarding",
        description: "Checklist for bringing on a new client",
        subtasksJson: [
          "Send welcome email with contract",
          "Schedule kickoff call",
          "Collect brand assets and guidelines",
          "Set up project board",
          "Define deliverables and milestones",
          "Agree on communication cadence",
          "Send first invoice (deposit)",
          "Add to CRM and calendar",
        ],
        category: "client_management",
        sortOrder: 0,
      },
      {
        modeId: hustleId,
        name: "Invoice Follow-up Chain",
        description: "Systematic follow-up for unpaid invoices",
        subtasksJson: [
          "Send initial invoice with 14-day terms",
          "Day 7: Friendly reminder email",
          "Day 14: Second reminder with urgency",
          "Day 21: Phone call follow-up",
          "Day 30: Final notice before collections",
        ],
        category: "billing",
        sortOrder: 1,
      },
      {
        modeId: hustleId,
        name: "Portfolio Update",
        description: "Keep your portfolio fresh and relevant",
        subtasksJson: [
          "Select 3 best recent projects",
          "Write case study for each",
          "Update screenshots and mockups",
          "Get client testimonials",
          "Update website and social profiles",
        ],
        category: "marketing",
        sortOrder: 2,
      },
      {
        modeId: hustleId,
        name: "Tax Season Prep",
        description: "Quarterly tax preparation checklist",
        subtasksJson: [
          "Export all invoices for the quarter",
          "Categorize business expenses",
          "Calculate estimated tax payment",
          "Review deductible expenses",
          "File estimated quarterly taxes",
        ],
        category: "finance",
        sortOrder: 3,
      },
      {
        modeId: hustleId,
        name: "Proposal Template",
        description: "Standard proposal for new client pitches",
        subtasksJson: [
          "Research client and their industry",
          "Define scope and deliverables",
          "Create timeline with milestones",
          "Prepare pricing breakdown",
          "Add portfolio samples and testimonials",
        ],
        category: "sales",
        sortOrder: 4,
      },
    );
  }

  if (closerId) {
    templateData.push(
      {
        modeId: closerId,
        name: "New Lead Follow-up",
        description: "Structured follow-up for new inbound leads",
        subtasksJson: [
          "Respond within 5 minutes of inquiry",
          "Qualify lead: budget, timeline, decision-maker",
          "Send personalized property/product list",
          "Schedule site visit or demo",
          "Follow up 24 hours after first contact",
        ],
        category: "lead_management",
        sortOrder: 0,
      },
      {
        modeId: closerId,
        name: "Site Visit Prep",
        description: "Preparation checklist before a property showing or demo",
        subtasksJson: [
          "Confirm appointment with client",
          "Review client preferences and budget",
          "Prepare property details and comparables",
          "Print or prepare digital brochures",
          "Plan route and arrive 15 minutes early",
        ],
        category: "client_meeting",
        sortOrder: 1,
      },
      {
        modeId: closerId,
        name: "Document Collection",
        description: "Gather all documents needed for closing",
        subtasksJson: [
          "Request ID proof from buyer/seller",
          "Collect financial pre-approval letter",
          "Verify property title and ownership",
          "Prepare sale agreement draft",
          "Schedule legal review",
        ],
        category: "closing",
        sortOrder: 2,
      },
      {
        modeId: closerId,
        name: "Monthly Market Update",
        description: "Stay on top of market trends",
        subtasksJson: [
          "Review local market data and trends",
          "Update comparable listings spreadsheet",
          "Send market update email to active leads",
          "Post market insights on social media",
          "Adjust pricing strategy if needed",
        ],
        category: "market_analysis",
        sortOrder: 3,
      },
      {
        modeId: closerId,
        name: "Closing Checklist",
        description: "Final steps to close the deal",
        subtasksJson: [
          "Verify all documents are signed",
          "Confirm payment or financing is in place",
          "Schedule final walkthrough",
          "Coordinate with legal and registry",
          "Hand over keys and congratulate client",
        ],
        category: "closing",
        sortOrder: 4,
      },
    );
  }

  if (grindId) {
    templateData.push(
      {
        modeId: grindId,
        name: "Daily Open Checklist",
        description: "Opening procedures for the day",
        subtasksJson: [
          "Unlock and inspect premises",
          "Turn on all equipment and POS systems",
          "Check cash register float",
          "Review staff schedule for the day",
          "Check inventory for low-stock items",
          "Brief morning team huddle",
        ],
        category: "daily_ops",
        sortOrder: 0,
      },
      {
        modeId: grindId,
        name: "Daily Close Checklist",
        description: "End-of-day closing procedures",
        subtasksJson: [
          "Reconcile cash register and card payments",
          "Clean and sanitize all work areas",
          "Restock shelves and displays",
          "Lock all doors and set alarm",
          "Submit daily sales report",
          "Turn off all non-essential equipment",
        ],
        category: "daily_ops",
        sortOrder: 1,
      },
      {
        modeId: grindId,
        name: "Restock Alert",
        description: "Inventory replenishment checklist",
        subtasksJson: [
          "Review items below minimum stock level",
          "Check supplier pricing and availability",
          "Place purchase orders",
          "Confirm delivery dates",
          "Update inventory system on arrival",
        ],
        category: "inventory",
        sortOrder: 2,
      },
      {
        modeId: grindId,
        name: "New Staff Onboarding",
        description: "Get new team members up to speed",
        subtasksJson: [
          "Complete employment paperwork",
          "Issue uniform and access credentials",
          "Walk through store layout and safety procedures",
          "Train on POS system and policies",
          "Assign a buddy for the first week",
          "Schedule 7-day check-in",
        ],
        category: "hr",
        sortOrder: 3,
      },
      {
        modeId: grindId,
        name: "Monthly Bills Tracker",
        description: "Track and pay all monthly business expenses",
        subtasksJson: [
          "Pay rent and utilities",
          "Process staff salaries",
          "Pay supplier invoices",
          "Review subscription costs",
          "File GST/tax returns",
          "Update cash flow spreadsheet",
        ],
        category: "finance",
        sortOrder: 4,
      },
      {
        modeId: grindId,
        name: "Customer Follow-up",
        description: "Maintain customer relationships",
        subtasksJson: [
          "Send thank-you message to new customers",
          "Follow up on pending customer requests",
          "Ask for reviews and referrals",
          "Resolve any open complaints",
          "Update customer contact list",
        ],
        category: "customer_service",
        sortOrder: 5,
      },
    );
  }

  if (templateData.length > 0) {
    await db
      .insert(schema.modeTemplates)
      .values(templateData)
      .onConflictDoNothing();
  }

  logger.info({ count: templateData.length }, "Mode templates seeded");

  // 4d. Seed dashboard widgets
  const widgetData: schema.NewModeDashboardWidget[] = [];

  if (hustleId) {
    widgetData.push(
      { modeId: hustleId, widgetType: "revenue_tracker", configJson: { label: "Revenue This Month", currency: "INR" }, sortOrder: 0 },
      { modeId: hustleId, widgetType: "active_clients", configJson: { label: "Active Clients" }, sortOrder: 1 },
      { modeId: hustleId, widgetType: "pending_invoices", configJson: { label: "Pending Invoices", alertThresholdDays: 14 }, sortOrder: 2 },
    );
  }

  if (closerId) {
    widgetData.push(
      { modeId: closerId, widgetType: "deal_pipeline", configJson: { label: "Deal Pipeline", stages: ["Lead", "Qualified", "Negotiating", "Closing", "Won"] }, sortOrder: 0 },
      { modeId: closerId, widgetType: "hot_leads", configJson: { label: "Hot Leads", minHeatScore: 8 }, sortOrder: 1 },
      { modeId: closerId, widgetType: "pending_follow_ups", configJson: { label: "Pending Follow-ups" }, sortOrder: 2 },
    );
  }

  if (grindId) {
    widgetData.push(
      { modeId: grindId, widgetType: "daily_checklist", configJson: { label: "Today's Checklist" }, sortOrder: 0 },
      { modeId: grindId, widgetType: "pending_orders", configJson: { label: "Pending Orders" }, sortOrder: 1 },
      { modeId: grindId, widgetType: "staff_tasks", configJson: { label: "Staff Tasks" }, sortOrder: 2 },
    );
  }

  if (widgetData.length > 0) {
    await db
      .insert(schema.modeDashboardWidgets)
      .values(widgetData)
      .onConflictDoNothing();
  }

  logger.info({ count: widgetData.length }, "Mode dashboard widgets seeded");

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
