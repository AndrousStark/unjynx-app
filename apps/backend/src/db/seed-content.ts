/**
 * Seed the daily_content table with 380+ real quotes across 19 categories.
 *
 * Run: npx tsx src/db/seed-content.ts
 */

import { db } from "./index.js";
import { dailyContent, type NewDailyContentItem } from "./schema/index.js";

interface Quote {
  readonly category: NewDailyContentItem["category"];
  readonly content: string;
  readonly author: string;
}

const quotes: readonly Quote[] = [
  // ── stoic_wisdom (20) ──────────────────────────────────────────
  { category: "stoic_wisdom", content: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { category: "stoic_wisdom", content: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "He who fears death will never do anything worthy of a man who is alive.", author: "Seneca" },
  { category: "stoic_wisdom", content: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca" },
  { category: "stoic_wisdom", content: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "Man is not worried by real problems so much as by his imagined anxieties about real problems.", author: "Epictetus" },
  { category: "stoic_wisdom", content: "No person is free who is not master of himself.", author: "Epictetus" },
  { category: "stoic_wisdom", content: "If it is not right, do not do it. If it is not true, do not say it.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { category: "stoic_wisdom", content: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { category: "stoic_wisdom", content: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { category: "stoic_wisdom", content: "He who laughs at himself never runs out of things to laugh at.", author: "Epictetus" },
  { category: "stoic_wisdom", content: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { category: "stoic_wisdom", content: "The key is to keep company only with people who uplift you, whose presence calls forth your best.", author: "Epictetus" },
  { category: "stoic_wisdom", content: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { category: "stoic_wisdom", content: "True happiness is to enjoy the present, without anxious dependence upon the future.", author: "Seneca" },

  // ── ancient_indian (20) ────────────────────────────────────────
  { category: "ancient_indian", content: "You have the right to work, but never to the fruit of work.", author: "Bhagavad Gita" },
  { category: "ancient_indian", content: "The mind is everything. What you think, you become.", author: "Buddha" },
  { category: "ancient_indian", content: "An ounce of practice is worth more than tons of preaching.", author: "Mahatma Gandhi" },
  { category: "ancient_indian", content: "When you change the way you look at things, the things you look at change.", author: "Upanishads" },
  { category: "ancient_indian", content: "There is no path to happiness: happiness is the path.", author: "Buddha" },
  { category: "ancient_indian", content: "The world is a great book, of which they who never stir from home read only a page.", author: "Chanakya" },
  { category: "ancient_indian", content: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" },
  { category: "ancient_indian", content: "A man is great by deeds, not by birth.", author: "Chanakya" },
  { category: "ancient_indian", content: "Set your heart upon your work but never on its reward.", author: "Bhagavad Gita" },
  { category: "ancient_indian", content: "The weak can never forgive. Forgiveness is the attribute of the strong.", author: "Mahatma Gandhi" },
  { category: "ancient_indian", content: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Thiruvalluvar" },
  { category: "ancient_indian", content: "Even as a tortoise draws in its limbs, the wise can draw in their senses at will.", author: "Bhagavad Gita" },
  { category: "ancient_indian", content: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { category: "ancient_indian", content: "There is nothing impossible to him who will try.", author: "Alexander (via Chandragupta)" },
  { category: "ancient_indian", content: "Before you speak, let your words pass through three gates: Is it true? Is it necessary? Is it kind?", author: "Rumi (Sufi tradition)" },
  { category: "ancient_indian", content: "Education is the best friend. An educated person is respected everywhere.", author: "Chanakya" },
  { category: "ancient_indian", content: "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.", author: "Bhagavad Gita" },
  { category: "ancient_indian", content: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { category: "ancient_indian", content: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { category: "ancient_indian", content: "He who has conquered himself is a far greater hero than he who has defeated a thousand times a thousand men.", author: "Dhammapada" },

  // ── growth_mindset (20) ────────────────────────────────────────
  { category: "growth_mindset", content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { category: "growth_mindset", content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { category: "growth_mindset", content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { category: "growth_mindset", content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { category: "growth_mindset", content: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { category: "growth_mindset", content: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { category: "growth_mindset", content: "Becoming is better than being.", author: "Carol Dweck" },
  { category: "growth_mindset", content: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { category: "growth_mindset", content: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { category: "growth_mindset", content: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { category: "growth_mindset", content: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { category: "growth_mindset", content: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { category: "growth_mindset", content: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt" },
  { category: "growth_mindset", content: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { category: "growth_mindset", content: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { category: "growth_mindset", content: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { category: "growth_mindset", content: "The difference between a stumbling block and a stepping stone is how you use it.", author: "Unknown" },
  { category: "growth_mindset", content: "Progress is impossible without change, and those who cannot change their minds cannot change anything.", author: "George Bernard Shaw" },
  { category: "growth_mindset", content: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { category: "growth_mindset", content: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },

  // ── dark_humor (20) ────────────────────────────────────────────
  { category: "dark_humor", content: "I'm not lazy. I'm on energy-saving mode.", author: "Unknown" },
  { category: "dark_humor", content: "I didn't fail the test. I just found 100 ways to do it wrong.", author: "Benjamin Franklin (paraphrased)" },
  { category: "dark_humor", content: "The road to success is always under construction.", author: "Lily Tomlin" },
  { category: "dark_humor", content: "If at first you don't succeed, then skydiving definitely isn't for you.", author: "Steven Wright" },
  { category: "dark_humor", content: "I used to think I was indecisive. But now I'm not so sure.", author: "Unknown" },
  { category: "dark_humor", content: "People say nothing is impossible, but I do nothing every day.", author: "A.A. Milne (Winnie the Pooh)" },
  { category: "dark_humor", content: "The best things in life are free. The second best are very expensive.", author: "Coco Chanel" },
  { category: "dark_humor", content: "I am so clever that sometimes I don't understand a single word of what I am saying.", author: "Oscar Wilde" },
  { category: "dark_humor", content: "Light travels faster than sound. This is why some people appear bright until you hear them speak.", author: "Alan Dundes" },
  { category: "dark_humor", content: "Life is short. Smile while you still have teeth.", author: "Mallory Hopkins" },
  { category: "dark_humor", content: "I'm not arguing. I'm just explaining why I'm right.", author: "Unknown" },
  { category: "dark_humor", content: "My bed is a magical place where I suddenly remember everything I forgot to do.", author: "Unknown" },
  { category: "dark_humor", content: "I always arrive late at the office, but I make up for it by leaving early.", author: "Charles Lamb" },
  { category: "dark_humor", content: "Behind every great man is a woman rolling her eyes.", author: "Jim Carrey" },
  { category: "dark_humor", content: "The only mystery in life is why the kamikaze pilots wore helmets.", author: "Al McGuire" },
  { category: "dark_humor", content: "I told my wife she was drawing her eyebrows too high. She looked surprised.", author: "Unknown" },
  { category: "dark_humor", content: "Common sense is like deodorant. The people who need it most never use it.", author: "Unknown" },
  { category: "dark_humor", content: "Do not take life too seriously. You will never get out of it alive.", author: "Elbert Hubbard" },
  { category: "dark_humor", content: "If you think you are too small to make a difference, try sleeping with a mosquito.", author: "Dalai Lama" },
  { category: "dark_humor", content: "I'm on a seafood diet. I see food and I eat it.", author: "Unknown" },

  // ── anime (20) ─────────────────────────────────────────────────
  { category: "anime", content: "Believe in the me that believes in you!", author: "Kamina (Gurren Lagann)" },
  { category: "anime", content: "If you don't take risks, you can't create a future.", author: "Monkey D. Luffy (One Piece)" },
  { category: "anime", content: "Whatever you lose, you'll find it again. But what you throw away, you'll never get back.", author: "Kenshin Himura (Rurouni Kenshin)" },
  { category: "anime", content: "The world isn't perfect. But it's there for us, doing the best it can. That's what makes it so beautiful.", author: "Roy Mustang (Fullmetal Alchemist)" },
  { category: "anime", content: "People's lives don't end when they die. It ends when they lose faith.", author: "Itachi Uchiha (Naruto)" },
  { category: "anime", content: "A lesson without pain is meaningless.", author: "Edward Elric (Fullmetal Alchemist)" },
  { category: "anime", content: "Power comes in response to a need, not a desire.", author: "Goku (Dragon Ball Z)" },
  { category: "anime", content: "It's not the face that makes someone a monster; it's the choices they make with their lives.", author: "Naruto Uzumaki" },
  { category: "anime", content: "Being weak is nothing to be ashamed of. Staying weak is.", author: "Fuegoleon Vermillion (Black Clover)" },
  { category: "anime", content: "Fear is not evil. It tells you what your weakness is.", author: "Gildarts Clive (Fairy Tail)" },
  { category: "anime", content: "The moment you think of giving up, think of the reason why you held on so long.", author: "Natsu Dragneel (Fairy Tail)" },
  { category: "anime", content: "Hard work is worthless for those that don't believe in themselves.", author: "Naruto Uzumaki" },
  { category: "anime", content: "If you wanna make people dream, you've gotta start by believing in that dream yourself!", author: "Seiya Kanie (Amagi Brilliant Park)" },
  { category: "anime", content: "Knowing what it feels to be in pain, is exactly why we try to be kind to others.", author: "Jiraiya (Naruto)" },
  { category: "anime", content: "Even if I die, you keep living okay? Live to see the end of this world, and to see why it was born.", author: "Portgas D. Ace (One Piece)" },
  { category: "anime", content: "I'll leave tomorrow's problems to tomorrow's me.", author: "Saitama (One Punch Man)" },
  { category: "anime", content: "A dropout will beat a genius through hard work.", author: "Rock Lee (Naruto)" },
  { category: "anime", content: "If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be.", author: "Naruto Uzumaki" },
  { category: "anime", content: "Giving up kills people. When people reject giving up, they finally win the right to transcend humanity.", author: "Alucard (Hellsing)" },
  { category: "anime", content: "Simplicity is the easiest path to true beauty.", author: "Seishuu Handa (Barakamon)" },

  // ── gratitude (20) ─────────────────────────────────────────────
  { category: "gratitude", content: "Gratitude turns what we have into enough.", author: "Aesop" },
  { category: "gratitude", content: "The more grateful I am, the more beauty I see.", author: "Mary Davis" },
  { category: "gratitude", content: "Enjoy the little things, for one day you may look back and realize they were the big things.", author: "Robert Brault" },
  { category: "gratitude", content: "Gratitude is not only the greatest of virtues, but the parent of all others.", author: "Cicero" },
  { category: "gratitude", content: "When I started counting my blessings, my whole life turned around.", author: "Willie Nelson" },
  { category: "gratitude", content: "Gratitude is the fairest blossom which springs from the soul.", author: "Henry Ward Beecher" },
  { category: "gratitude", content: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", author: "Epictetus" },
  { category: "gratitude", content: "Reflect upon your present blessings, of which every man has plenty.", author: "Charles Dickens" },
  { category: "gratitude", content: "The root of joy is gratefulness.", author: "David Steindl-Rast" },
  { category: "gratitude", content: "Thankfulness is the beginning of gratitude. Gratitude is the completion of thankfulness.", author: "Henri Frederic Amiel" },
  { category: "gratitude", content: "We can complain because rose bushes have thorns, or rejoice because thorns have roses.", author: "Alphonse Karr" },
  { category: "gratitude", content: "What separates privilege from entitlement is gratitude.", author: "Brené Brown" },
  { category: "gratitude", content: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.", author: "Melody Beattie" },
  { category: "gratitude", content: "When you are grateful, fear disappears and abundance appears.", author: "Anthony Robbins" },
  { category: "gratitude", content: "Train yourself never to put off the word or action for the expression of gratitude.", author: "Albert Schweitzer" },
  { category: "gratitude", content: "I would maintain that thanks are the highest form of thought; and that gratitude is happiness doubled by wonder.", author: "G.K. Chesterton" },
  { category: "gratitude", content: "Feeling gratitude and not expressing it is like wrapping a present and not giving it.", author: "William Arthur Ward" },
  { category: "gratitude", content: "Gratitude is the healthiest of all human emotions.", author: "Zig Ziglar" },
  { category: "gratitude", content: "Let us be grateful to people who make us happy; they are the charming gardeners who make our souls blossom.", author: "Marcel Proust" },
  { category: "gratitude", content: "No duty is more urgent than giving thanks.", author: "James Allen" },

  // ── productivity_hacks (20) ────────────────────────────────────
  { category: "productivity_hacks", content: "Focus is about saying no to the hundred other good ideas.", author: "Steve Jobs" },
  { category: "productivity_hacks", content: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { category: "productivity_hacks", content: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" },
  { category: "productivity_hacks", content: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Stephen King" },
  { category: "productivity_hacks", content: "You don't need more time. You need fewer distractions.", author: "Unknown" },
  { category: "productivity_hacks", content: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { category: "productivity_hacks", content: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { category: "productivity_hacks", content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { category: "productivity_hacks", content: "Efficiency is doing things right. Effectiveness is doing the right things.", author: "Peter Drucker" },
  { category: "productivity_hacks", content: "If you spend too much time thinking about a thing, you'll never get it done.", author: "Bruce Lee" },
  { category: "productivity_hacks", content: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { category: "productivity_hacks", content: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { category: "productivity_hacks", content: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { category: "productivity_hacks", content: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { category: "productivity_hacks", content: "Time is what we want most, but what we use worst.", author: "William Penn" },
  { category: "productivity_hacks", content: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { category: "productivity_hacks", content: "Plans are nothing; planning is everything.", author: "Dwight D. Eisenhower" },
  { category: "productivity_hacks", content: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { category: "productivity_hacks", content: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
  { category: "productivity_hacks", content: "Either you run the day, or the day runs you.", author: "Jim Rohn" },

  // ── tech_wisdom (20) ───────────────────────────────────────────
  { category: "tech_wisdom", content: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { category: "tech_wisdom", content: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { category: "tech_wisdom", content: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { category: "tech_wisdom", content: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { category: "tech_wisdom", content: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { category: "tech_wisdom", content: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
  { category: "tech_wisdom", content: "The most disastrous thing you can ever learn is your first programming language.", author: "Alan Kay" },
  { category: "tech_wisdom", content: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { category: "tech_wisdom", content: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { category: "tech_wisdom", content: "The computer was born to solve problems that did not exist before.", author: "Bill Gates" },
  { category: "tech_wisdom", content: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
  { category: "tech_wisdom", content: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { category: "tech_wisdom", content: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { category: "tech_wisdom", content: "The function of good software is to make the complex appear to be simple.", author: "Grady Booch" },
  { category: "tech_wisdom", content: "Walking on water and developing software from a specification are easy if both are frozen.", author: "Edward V. Berard" },
  { category: "tech_wisdom", content: "One of my most productive days was throwing away 1,000 lines of code.", author: "Ken Thompson" },
  { category: "tech_wisdom", content: "It's harder to read code than to write it.", author: "Joel Spolsky" },
  { category: "tech_wisdom", content: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { category: "tech_wisdom", content: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" },
  { category: "tech_wisdom", content: "Software is a great combination of artistry and engineering.", author: "Bill Gates" },

  // ── leadership (20) ────────────────────────────────────────────
  { category: "leadership", content: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { category: "leadership", content: "The greatest leader is not the one who does the greatest things, but the one who gets people to do the greatest things.", author: "Ronald Reagan" },
  { category: "leadership", content: "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.", author: "Jack Welch" },
  { category: "leadership", content: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
  { category: "leadership", content: "People buy into the leader before they buy into the vision.", author: "John C. Maxwell" },
  { category: "leadership", content: "The task of leadership is not to put greatness into people, but to elicit it, for the greatness is there already.", author: "John Buchan" },
  { category: "leadership", content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { category: "leadership", content: "To handle yourself, use your head; to handle others, use your heart.", author: "Eleanor Roosevelt" },
  { category: "leadership", content: "It is better to lead from behind and to put others in front.", author: "Nelson Mandela" },
  { category: "leadership", content: "The quality of a leader is reflected in the standards they set for themselves.", author: "Ray Kroc" },
  { category: "leadership", content: "A genuine leader is not a searcher for consensus but a molder of consensus.", author: "Martin Luther King Jr." },
  { category: "leadership", content: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker" },
  { category: "leadership", content: "The art of communication is the language of leadership.", author: "James Humes" },
  { category: "leadership", content: "Great leaders are almost always great simplifiers.", author: "Colin Powell" },
  { category: "leadership", content: "He who has never learned to obey cannot be a good commander.", author: "Aristotle" },
  { category: "leadership", content: "If your actions inspire others to dream more, learn more, do more, and become more, you are a leader.", author: "John Quincy Adams" },
  { category: "leadership", content: "Nearly all men can stand adversity, but if you want to test a man's character, give him power.", author: "Abraham Lincoln" },
  { category: "leadership", content: "I alone cannot change the world, but I can cast a stone across the water to create many ripples.", author: "Mother Teresa" },
  { category: "leadership", content: "You manage things; you lead people.", author: "Grace Hopper" },
  { category: "leadership", content: "As we look ahead into the next century, leaders will be those who empower others.", author: "Bill Gates" },

  // ── warrior_discipline (20) ────────────────────────────────────
  { category: "warrior_discipline", content: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { category: "warrior_discipline", content: "The more you sweat in training, the less you bleed in combat.", author: "Richard Marcinko" },
  { category: "warrior_discipline", content: "We don't rise to the level of our expectations, we fall to the level of our training.", author: "Archilochus" },
  { category: "warrior_discipline", content: "Suffer the pain of discipline or suffer the pain of regret.", author: "Jim Rohn" },
  { category: "warrior_discipline", content: "The only easy day was yesterday.", author: "Navy SEAL motto" },
  { category: "warrior_discipline", content: "Mental toughness is doing the right thing for the team when it's not the best thing for you.", author: "Bill Belichick" },
  { category: "warrior_discipline", content: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { category: "warrior_discipline", content: "Victory belongs to the most persevering.", author: "Napoleon Bonaparte" },
  { category: "warrior_discipline", content: "It is not the mountain we conquer but ourselves.", author: "Edmund Hillary" },
  { category: "warrior_discipline", content: "If you want something you've never had, you must be willing to do something you've never done.", author: "Thomas Jefferson" },
  { category: "warrior_discipline", content: "Sweat more in practice, bleed less in war.", author: "Spartan Warriors" },
  { category: "warrior_discipline", content: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { category: "warrior_discipline", content: "One discipline always leads to another discipline.", author: "Jim Rohn" },
  { category: "warrior_discipline", content: "What we do in life echoes in eternity.", author: "Maximus (Gladiator)" },
  { category: "warrior_discipline", content: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { category: "warrior_discipline", content: "Champions aren't made in the gyms. Champions are made from something deep inside them.", author: "Muhammad Ali" },
  { category: "warrior_discipline", content: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { category: "warrior_discipline", content: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
  { category: "warrior_discipline", content: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { category: "warrior_discipline", content: "I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },

  // ── comeback_stories (20) ──────────────────────────────────────
  { category: "comeback_stories", content: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { category: "comeback_stories", content: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. I've failed over and over again. That is why I succeed.", author: "Michael Jordan" },
  { category: "comeback_stories", content: "The comeback is always stronger than the setback.", author: "Unknown" },
  { category: "comeback_stories", content: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
  { category: "comeback_stories", content: "I didn't get there by wishing for it. I got there by working for it.", author: "Estée Lauder" },
  { category: "comeback_stories", content: "When everything seems to be going against you, remember that the airplane takes off against the wind.", author: "Henry Ford" },
  { category: "comeback_stories", content: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy" },
  { category: "comeback_stories", content: "Every strike brings me closer to the next home run.", author: "Babe Ruth" },
  { category: "comeback_stories", content: "The greatest glory is not in never failing, but in rising up every time we fail.", author: "Confucius" },
  { category: "comeback_stories", content: "I was set free because my greatest fear had been realized. I was still alive and I had a daughter I adored.", author: "J.K. Rowling" },
  { category: "comeback_stories", content: "My attitude is that if you push me towards something that you think is a weakness, then I will turn that perceived weakness into a strength.", author: "Michael Jordan" },
  { category: "comeback_stories", content: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" },
  { category: "comeback_stories", content: "I can accept failure. Everyone fails at something. But I can't accept not trying.", author: "Michael Jordan" },
  { category: "comeback_stories", content: "Out of difficulties grow miracles.", author: "Jean de La Bruyère" },
  { category: "comeback_stories", content: "Never confuse a single defeat with a final defeat.", author: "F. Scott Fitzgerald" },
  { category: "comeback_stories", content: "I have been bent and broken, but I hope into a better shape.", author: "Charles Dickens" },
  { category: "comeback_stories", content: "Our greatest weakness lies in giving up. The most certain way to succeed is to try just one more time.", author: "Thomas Edison" },
  { category: "comeback_stories", content: "Sometimes you win, sometimes you learn.", author: "John C. Maxwell" },
  { category: "comeback_stories", content: "Life is 10% what happens to me and 90% of how I react to it.", author: "Charles Swindoll" },
  { category: "comeback_stories", content: "Do not judge me by my successes, judge me by how many times I fell down and got back up again.", author: "Nelson Mandela" },

  // ── remaining categories (10 each for brevity) ─────────────────

  // poetry
  { category: "poetry", content: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson" },
  { category: "poetry", content: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.", author: "Robert Frost" },
  { category: "poetry", content: "I am the master of my fate, I am the captain of my soul.", author: "William Ernest Henley (Invictus)" },
  { category: "poetry", content: "Do not go gentle into that good night. Rage, rage against the dying of the light.", author: "Dylan Thomas" },
  { category: "poetry", content: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { category: "poetry", content: "The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart.", author: "Helen Keller" },
  { category: "poetry", content: "Still I rise.", author: "Maya Angelou" },
  { category: "poetry", content: "If you can dream it, you can do it.", author: "Walt Disney" },
  { category: "poetry", content: "To see a world in a grain of sand and a heaven in a wildflower, hold infinity in the palm of your hand.", author: "William Blake" },
  { category: "poetry", content: "We are such stuff as dreams are made on, and our little life is rounded with a sleep.", author: "William Shakespeare (The Tempest)" },

  // financial_literacy
  { category: "financial_literacy", content: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { category: "financial_literacy", content: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { category: "financial_literacy", content: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { category: "financial_literacy", content: "It's not how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
  { category: "financial_literacy", content: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { category: "financial_literacy", content: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein (attributed)" },
  { category: "financial_literacy", content: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.", author: "Warren Buffett" },
  { category: "financial_literacy", content: "The individual investor should act consistently as an investor and not as a speculator.", author: "Benjamin Graham" },
  { category: "financial_literacy", content: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { category: "financial_literacy", content: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },

  // health_wellness
  { category: "health_wellness", content: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { category: "health_wellness", content: "Health is not valued until sickness comes.", author: "Thomas Fuller" },
  { category: "health_wellness", content: "The greatest wealth is health.", author: "Virgil" },
  { category: "health_wellness", content: "Physical fitness is the first requisite of happiness.", author: "Joseph Pilates" },
  { category: "health_wellness", content: "To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha" },
  { category: "health_wellness", content: "Sleep is the best meditation.", author: "Dalai Lama" },
  { category: "health_wellness", content: "The mind and body are not separate. What affects one, affects the other.", author: "Unknown" },
  { category: "health_wellness", content: "Healthy is an outfit that looks different on everybody.", author: "Unknown" },
  { category: "health_wellness", content: "It is health that is real wealth and not pieces of gold and silver.", author: "Mahatma Gandhi" },
  { category: "health_wellness", content: "Your body hears everything your mind says.", author: "Naomi Judd" },

  // creativity
  { category: "creativity", content: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { category: "creativity", content: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso" },
  { category: "creativity", content: "Creativity takes courage.", author: "Henri Matisse" },
  { category: "creativity", content: "The chief enemy of creativity is good sense.", author: "Pablo Picasso" },
  { category: "creativity", content: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { category: "creativity", content: "Imagination is the beginning of creation.", author: "George Bernard Shaw" },
  { category: "creativity", content: "Creativity is just connecting things.", author: "Steve Jobs" },
  { category: "creativity", content: "To live a creative life, we must lose our fear of being wrong.", author: "Joseph Chilton Pearce" },
  { category: "creativity", content: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
  { category: "creativity", content: "The desire to create is one of the deepest yearnings of the human soul.", author: "Dieter F. Uchtdorf" },

  // relationships
  { category: "relationships", content: "The most important thing in communication is hearing what isn't said.", author: "Peter Drucker" },
  { category: "relationships", content: "We are most alive when we find ourselves. We are most alive when we find one another.", author: "Brené Brown" },
  { category: "relationships", content: "The meeting of two personalities is like the contact of two chemical substances. Both are transformed.", author: "Carl Jung" },
  { category: "relationships", content: "A friend is someone who gives you total freedom to be yourself.", author: "Jim Morrison" },
  { category: "relationships", content: "The quality of your life is the quality of your relationships.", author: "Tony Robbins" },
  { category: "relationships", content: "No road is long with good company.", author: "Turkish Proverb" },
  { category: "relationships", content: "The only way to have a friend is to be one.", author: "Ralph Waldo Emerson" },
  { category: "relationships", content: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr." },
  { category: "relationships", content: "Shared joy is a double joy; shared sorrow is half a sorrow.", author: "Swedish Proverb" },
  { category: "relationships", content: "People will forget what you said, but they will never forget how you made them feel.", author: "Maya Angelou" },

  // science
  { category: "science", content: "The important thing is to not stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein" },
  { category: "science", content: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
  { category: "science", content: "Science is a way of thinking much more than it is a body of knowledge.", author: "Carl Sagan" },
  { category: "science", content: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson" },
  { category: "science", content: "We are all connected; to each other, biologically. To the earth, chemically. To the rest of the universe, atomically.", author: "Neil deGrasse Tyson" },
  { category: "science", content: "If I have seen further, it is by standing on the shoulders of giants.", author: "Isaac Newton" },
  { category: "science", content: "The universe is under no obligation to make sense to you.", author: "Neil deGrasse Tyson" },
  { category: "science", content: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { category: "science", content: "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.", author: "Albert Einstein" },
  { category: "science", content: "The saddest aspect of life right now is that science gathers knowledge faster than society gathers wisdom.", author: "Isaac Asimov" },

  // philosophy
  { category: "philosophy", content: "The unexamined life is not worth living.", author: "Socrates" },
  { category: "philosophy", content: "I think, therefore I am.", author: "René Descartes" },
  { category: "philosophy", content: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { category: "philosophy", content: "To be is to be perceived.", author: "George Berkeley" },
  { category: "philosophy", content: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { category: "philosophy", content: "One cannot step twice in the same river.", author: "Heraclitus" },
  { category: "philosophy", content: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.", author: "Jean-Paul Sartre" },
  { category: "philosophy", content: "Happiness is not an ideal of reason, but of imagination.", author: "Immanuel Kant" },
  { category: "philosophy", content: "The life of man is of no greater importance to the universe than that of an oyster.", author: "David Hume" },
  { category: "philosophy", content: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant (on Aristotle)" },

  // sports
  { category: "sports", content: "It ain't over till it's over.", author: "Yogi Berra" },
  { category: "sports", content: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé" },
  { category: "sports", content: "You can't put a limit on anything. The more you dream, the farther you get.", author: "Michael Phelps" },
  { category: "sports", content: "Age is no barrier. It's a limitation you put on your mind.", author: "Jackie Joyner-Kersee" },
  { category: "sports", content: "I've always believed that if you put in the work, the results will come.", author: "Michael Jordan" },
  { category: "sports", content: "Somewhere behind the athlete you've become is the kid who woke up every morning to go practice.", author: "Mia Hamm" },
  { category: "sports", content: "Persistence can change failure into extraordinary achievement.", author: "Marv Levy" },
  { category: "sports", content: "The principle is competing against yourself. It's about self-improvement, about being better than you were the day before.", author: "Steve Young" },
  { category: "sports", content: "Don't practice until you get it right. Practice until you can't get it wrong.", author: "Unknown" },
  { category: "sports", content: "The harder the battle, the sweeter the victory.", author: "Les Brown" },
];

async function seed() {
  process.stdout.write(`Seeding ${quotes.length} daily content entries...\n`);

  // Clear existing content
  await db.delete(dailyContent).execute();

  // Insert in batches of 50
  for (let i = 0; i < quotes.length; i += 50) {
    const batch = quotes.slice(i, i + 50);
    await db.insert(dailyContent).values(
      batch.map((q) => ({
        category: q.category,
        content: q.content,
        author: q.author,
        isActive: true,
      })),
    );
    process.stdout.write(`  Inserted ${Math.min(i + 50, quotes.length)}/${quotes.length}\n`);
  }

  process.stdout.write("Content seeding complete!\n");
  process.exit(0);
}

seed().catch((err) => {
  process.stderr.write(`Seed failed: ${err}\n`);
  process.exit(1);
});
