/**
 * Greeting engine.
 *
 * Every message is assembled from four independently chosen pieces: an
 * opener, a themed line, a Bible verse (KJV, public domain) and a closing
 * emoji. Picks are deterministic per contact and date, so reloading the page
 * shows the same message, while different people and different days vary.
 * Messages never include the recipient's name.
 */

const OPENERS = [
  "Good {timeOfDay}.",
  "Good {timeOfDay} to you.",
  "Good {timeOfDay} — hope you're well.",
  "Good {timeOfDay}, hope all is well with you.",
  "Good {timeOfDay}! Hope you're keeping well.",
  "Good {timeOfDay}, sending a quick word today.",
  "Good {timeOfDay}. Just a brief note.",
  "Good {timeOfDay} to you — hope today treats you kindly.",
  "Good {timeOfDay}, trust you're doing well.",
  "Good {timeOfDay}! A short greeting for you.",
  "Good {timeOfDay}, hope you're doing great.",
  "Good {timeOfDay} — a quick hello.",
  "Good {timeOfDay}, hope this meets you well.",
  "Good {timeOfDay}! Thinking of you today.",
  "Good {timeOfDay}, hope you're in good spirits.",
  "Good {timeOfDay} — just checking in with a word.",
];

const CLOSERS = [
  "🙏", "🌿", "✨", "🙌", "💛", "🌟", "😊", "💪",
  "🕊️", "☀️", "❤️", "🌻", "🙂", "🌸",
];

// Date.getDay(): 0 = Sunday ... 6 = Saturday. Sunday is treated as the
// first day of the week here (the "new week" theme sits on Sunday, not
// Monday), matching how the week is reckoned for these greetings.
export const THEMES = {
  0: { // Sunday — worship, rest, a fresh week ahead
    lines: [
      "Praying this new week is filled with God's peace and direction.",
      "Wishing you a worshipful, restful Sunday.",
      "May fresh grace meet you as this new week opens.",
      "Praying for a week ahead marked by God's favour.",
      "Wishing you a blessed day of worship and rest.",
      "May this new week unfold well for you.",
      "Praying your worship today draws you closer to God.",
      "May this new week bring clarity and purpose.",
      "Wishing you a Sunday filled with peace.",
      "May God go ahead of you into this new week.",
    ],
    verses: [
      { text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", ref: "Psalm 118:24" },
      { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
      { text: "They that wait upon the LORD shall renew their strength.", ref: "Isaiah 40:31" },
      { text: "O come, let us worship and bow down.", ref: "Psalm 95:6" },
      { text: "It is a good thing to give thanks unto the LORD.", ref: "Psalm 92:1" },
      { text: "Let us come before his presence with thanksgiving.", ref: "Psalm 95:2" },
      { text: "Enter into his gates with thanksgiving.", ref: "Psalm 100:4" },
      { text: "This is the LORD's doing; it is marvellous in our eyes.", ref: "Psalm 118:23" },
    ],
  },
  1: { // Monday — momentum, strength
    lines: [
      "Wishing you strength and clarity as the week begins.",
      "May today's efforts yield good progress.",
      "Praying for a focused and fruitful start to the week.",
      "May your plans today be established and blessed.",
      "Wishing you steady progress in all you set out to do.",
      "May this week open well for you.",
      "Praying fresh strength meets you this morning.",
      "May this Monday set the tone for a good week.",
      "Wishing you a clear head and a willing heart today.",
      "May your first steps this week be sure ones.",
    ],
    verses: [
      { text: "I can do all things through Christ which strengtheneth me.", ref: "Philippians 4:13" },
      { text: "Commit thy works unto the LORD, and thy thoughts shall be established.", ref: "Proverbs 16:3" },
      { text: "The LORD will perfect that which concerneth me.", ref: "Psalm 138:8" },
      { text: "The LORD shall increase you more and more.", ref: "Psalm 115:14" },
      { text: "Be strong and of a good courage.", ref: "Joshua 1:6" },
      { text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", ref: "Psalm 118:24" },
      { text: "The LORD is my strength and my shield.", ref: "Psalm 28:7" },
      { text: "In all thy ways acknowledge him, and he shall direct thy paths.", ref: "Proverbs 3:6" },
    ],
  },
  2: { // Tuesday — diligence
    lines: [
      "Wishing you diligence and fruitfulness in your labour today.",
      "May your hard work be met with good success.",
      "Praying for strength for every task ahead of you.",
      "May today's work bring lasting reward.",
      "Wishing you focus and energy for all you do today.",
      "May your diligence today be richly rewarded.",
      "Praying your efforts today are not in vain.",
      "May today's labour yield tomorrow's testimony.",
      "Wishing you steady hands and a clear plan today.",
      "May you finish today's work well and at peace.",
    ],
    verses: [
      { text: "And whatsoever ye do, do it heartily, as to the Lord.", ref: "Colossians 3:23" },
      { text: "Whatsoever thy hand findeth to do, do it with thy might.", ref: "Ecclesiastes 9:10" },
      { text: "The hand of the diligent maketh rich.", ref: "Proverbs 10:4" },
      { text: "In all labour there is profit.", ref: "Proverbs 14:23" },
      { text: "The soul of the diligent shall be made fat.", ref: "Proverbs 13:4" },
      { text: "Seest thou a man diligent in his business? he shall stand before kings.", ref: "Proverbs 22:29" },
      { text: "Let us not be weary in well doing: for in due season we shall reap.", ref: "Galatians 6:9" },
      { text: "The LORD thy God shall bless thee in all thine works.", ref: "Deuteronomy 15:18" },
    ],
  },
  3: { // Wednesday — wisdom, midweek
    lines: [
      "Praying for wisdom in every decision today.",
      "May clarity meet you halfway through this week.",
      "Wishing you renewed strength for the days ahead.",
      "May good counsel find you today.",
      "Praying for a steady, wise heart today.",
      "May today bring the understanding you need.",
      "Wishing you discernment in every matter today.",
      "May today carry you well over the hump of the week.",
      "Praying for a sound mind and a peaceful heart today.",
      "May you see clearly what to do next.",
    ],
    verses: [
      { text: "If any of you lack wisdom, let him ask of God.", ref: "James 1:5" },
      { text: "The fear of the LORD is the beginning of wisdom.", ref: "Psalm 111:10" },
      { text: "Get wisdom, get understanding.", ref: "Proverbs 4:5" },
      { text: "But they that wait upon the LORD shall renew their strength.", ref: "Isaiah 40:31" },
      { text: "A wise man will hear, and will increase learning.", ref: "Proverbs 1:5" },
      { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", ref: "Proverbs 3:5" },
      { text: "God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", ref: "2 Timothy 1:7" },
      { text: "The path of the just is as the shining light.", ref: "Proverbs 4:18" },
    ],
  },
  4: { // Thursday — gratitude
    lines: [
      "Wishing you a heart full of gratitude today.",
      "May today be filled with reasons to be thankful.",
      "Praying for joy to find you today.",
      "May contentment and thanksgiving mark your day.",
      "Wishing you eyes to see today's blessings.",
      "May gratitude light up your day.",
      "Praying your heart overflows with thanks today.",
      "May you count today's blessings one by one.",
      "Wishing you a day marked by praise.",
      "May joy be your strength today.",
    ],
    verses: [
      { text: "In every thing give thanks: for this is the will of God.", ref: "1 Thessalonians 5:18" },
      { text: "O give thanks unto the LORD; for he is good.", ref: "Psalm 107:1" },
      { text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", ref: "Psalm 118:24" },
      { text: "Rejoice in the Lord alway.", ref: "Philippians 4:4" },
      { text: "Let everything that hath breath praise the LORD.", ref: "Psalm 150:6" },
      { text: "The joy of the LORD is your strength.", ref: "Nehemiah 8:10" },
      { text: "Bless the LORD, O my soul, and forget not all his benefits.", ref: "Psalm 103:2" },
      { text: "Enter into his gates with thanksgiving.", ref: "Psalm 100:4" },
    ],
  },
  5: { // Friday — grace, closing the week well
    lines: [
      "May God's grace carry you well into the weekend.",
      "Wishing you a well-deserved rest as the week closes.",
      "Praying strength meets you at the finish line this week.",
      "May this Friday bring relief and peace.",
      "Wishing you a joyful close to the week.",
      "May grace cover whatever the week left undone.",
      "Praying you finish this week stronger than you started.",
      "May the weekend ahead be a true rest for you.",
      "Wishing you peace as this week draws to a close.",
      "May God's faithfulness carry you through the weekend.",
    ],
    verses: [
      { text: "My grace is sufficient for thee.", ref: "2 Corinthians 12:9" },
      { text: "The LORD shall preserve thy going out and thy coming in.", ref: "Psalm 121:8" },
      { text: "His mercy endureth for ever.", ref: "Psalm 136:1" },
      { text: "Great is thy faithfulness.", ref: "Lamentations 3:23" },
      { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1" },
      { text: "Casting all your care upon him; for he careth for you.", ref: "1 Peter 5:7" },
      { text: "Let not your heart be troubled.", ref: "John 14:1" },
      { text: "The LORD will give strength unto his people; the LORD will bless his people with peace.", ref: "Psalm 29:11" },
    ],
  },
  6: { // Saturday — rest, family
    lines: [
      "Wishing you a restful Saturday with loved ones.",
      "May today bring true rest and refreshing.",
      "Praying for peaceful, unhurried hours today.",
      "May your home be filled with joy today.",
      "Wishing you a calm and happy Saturday.",
      "May rest find you fully today.",
      "Praying today restores your body and spirit.",
      "May laughter and peace fill your home today.",
      "Wishing you unhurried, restful hours today.",
      "May today be gentle and good to you.",
    ],
    verses: [
      { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
      { text: "In quietness and in confidence shall be your strength.", ref: "Isaiah 30:15" },
      { text: "He maketh me to lie down in green pastures.", ref: "Psalm 23:2" },
      { text: "Return unto thy rest, O my soul.", ref: "Psalm 116:7" },
      { text: "Great peace have they which love thy law.", ref: "Psalm 119:165" },
      { text: "I will both lay me down in peace, and sleep.", ref: "Psalm 4:8" },
      { text: "As for God, his way is perfect.", ref: "Psalm 18:30" },
      { text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee.", ref: "Isaiah 26:3" },
    ],
  },
};

// Used only on the 1st of each month, in place of the day-of-week theme —
// Nigerian church custom of sending "Happy New Month" prayers on day one.
const NEW_MONTH_THEME = {
  lines: [
    "Praying this new month is marked by God's mercy and faithfulness.",
    "May {month} bring fresh grace and open doors.",
    "Welcoming {month} with a prayer that every need is met.",
    "May {month} be a season of good news for you.",
    "Praying {month} opens doors you've long awaited.",
    "Wishing you a {month} filled with peace and progress.",
    "May {month} surprise you with God's goodness.",
    "Praying {month} brings breakthrough in every area.",
    "Welcoming {month} with faith for greater things.",
    "May this {month} be better than the last.",
  ],
  verses: [
    { text: "His compassions fail not. They are new every morning: great is thy faithfulness.", ref: "Lamentations 3:22-23" },
    { text: "The LORD will give grace and glory: no good thing will he withhold.", ref: "Psalm 84:11" },
    { text: "My God shall supply all your need according to his riches in glory.", ref: "Philippians 4:19" },
    { text: "Behold, I will do a new thing.", ref: "Isaiah 43:19" },
    { text: "Old things are passed away; behold, all things are become new.", ref: "2 Corinthians 5:17" },
    { text: "Thou crownest the year with thy goodness.", ref: "Psalm 65:11" },
    { text: "The LORD hath been mindful of us: he will bless us.", ref: "Psalm 115:12" },
    { text: "I will pour water upon him that is thirsty, and floods upon the dry ground.", ref: "Isaiah 44:3" },
  ],
};

// Simple, dependency-free string hash so each "random" pick is deterministic
// per contact+day+slot (stable if you reload the page) but varies across
// contacts, across days, and across the four message slots — without
// needing to store anything extra.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function greetingFor(contact, viewDate) {
  const isFirstOfMonth = viewDate.getDate() === 1;
  const theme = isFirstOfMonth ? NEW_MONTH_THEME : THEMES[viewDate.getDay()];
  const dateKey = fmtDateKey(viewDate);
  const seed = contact.phone + '|' + dateKey;

  const opener = OPENERS[hashString(seed + '|opener') % OPENERS.length];
  const line = theme.lines[hashString(seed + '|line') % theme.lines.length];
  const verse = theme.verses[hashString(seed + '|verse') % theme.verses.length];
  const closer = CLOSERS[hashString(seed + '|closer') % CLOSERS.length];

  const month = MONTH_NAMES[viewDate.getMonth()];
  return `${opener.replace(/{timeOfDay}/g, timeOfDay())} ${line.replace(/{month}/g, month)} "${verse.text}" — ${verse.ref} (KJV) ${closer}`;
}


function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDateKey(d) {
  const dd = dateOnly(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
}


/** Short names for each weekday's theme, shown in the day banner. */
export const THEME_NAMES = {
  0: 'A new week',
  1: 'Strength',
  2: 'Diligence',
  3: 'Wisdom',
  4: 'Gratitude',
  5: 'Grace',
  6: 'Rest',
};
export const NEW_MONTH_NAME = 'New month';

/** Name of the theme that applies on the given date. */
export function themeNameFor(date) {
  return date.getDate() === 1 ? NEW_MONTH_NAME : THEME_NAMES[date.getDay()];
}

/** Builds the WhatsApp click-to-chat link for a number and message. */
export function waLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
