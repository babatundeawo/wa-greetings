/**
 * Greeting engine.
 *
 * Every message is a short, prayerful note written from a Nigerian point of
 * view. It is assembled from independently chosen pieces:
 *
 *   1. an opener that greets for the time of day and the day itself
 *   2. a short reflection that fits the day's theme
 *   3. a prayer for the day, followed by a prayer for the time of day
 *   4. an "Amen", a short well-wish for the time of day and a closing emoji
 *
 * The wording speaks as "we" and "us", so it reads naturally for anyone,
 * whether they are older, younger, family or someone you barely know. There
 * are no Bible verses and the recipient's name is never used.
 *
 * Picks are deterministic per contact and date, so reloading the page shows
 * the same message, while different people and different days vary.
 */

// {tod} = morning / afternoon / evening, {wish} = the day's greeting.
const OPENERS = [
  "Good {tod}! {wish}.",
  "{wish}, and good {tod} to you!",
  "Good {tod} to you and your household. {wish}!",
  "Good {tod}, dear one. {wish}!",
  "A very good {tod} to you. {wish}!",
  "Good {tod}! Trust you are keeping well. {wish}!",
  "{wish}! Good {tod} to you and your loved ones.",
  "Good {tod}! Hope you are doing great. {wish}.",
];

const AMENS = [
  "Amen.",
  "In Jesus' name, amen.",
  "This is our prayer. Amen.",
  "And we say a big Amen!",
  "We receive it. Amen.",
  "Let it be so, in Jesus' name. Amen.",
];

// A short well-wish that ends the message, matched to the time of day.
const WELL_WISHES = {
  morning: [
    "Have a blessed and productive day ahead.",
    "Go well today, and may joy find you on the way.",
    "Wishing you a bright, safe and fruitful day.",
  ],
  afternoon: [
    "Have a blessed and peaceful rest of the day.",
    "Keep going, and may the rest of your day be lighter than the start.",
    "Wishing you a calm, safe and fruitful afternoon.",
  ],
  evening: [
    "Have a restful and peaceful evening.",
    "Rest well tonight, and wake up to joy.",
    "Wishing you a calm evening and a sweet night's sleep.",
  ],
};

const CLOSERS = [
  "🙏", "🌿", "✨", "🙌", "💛", "🌟", "😊", "🕊️",
  "☀️", "❤️", "🌻", "🙂", "🌸", "🤝",
];

// A prayer matched to the time the message is opened.
const TIME_PRAYERS = {
  morning: [
    "As we step out this morning, may God order our steps, shield us on every road and bring us back home safe.",
    "May the Lord who kept us through the night go before us today and make every crooked path straight.",
    "May our morning hustle meet divine favour, and may no door we knock on be shut against us.",
    "May this morning's light bring good news, fresh strength and open doors.",
    "May we leave our houses in peace and return in joy, with testimonies to share.",
    "Whatever we are facing this morning, may the mercy of God speak for us.",
  ],
  afternoon: [
    "As the day wears on, may God renew our strength and keep us from every weariness of body and mind.",
    "May the rest of today bring us good news, unexpected favour and a calm heart.",
    "In the heat of the afternoon, may the Lord be our shade and our provider.",
    "May no pressure of today weigh us down; may grace carry us to the finish line of the day.",
    "May God finish what He started in our hands today and let it speak well for us.",
    "Wherever this afternoon finds us, in traffic, at the office, in the market or at home, may the peace of God find us there too.",
  ],
  evening: [
    "As the day closes, may God gather us safely home and turn today's tiredness into thanksgiving.",
    "May the Lord who brought us through today keep us through the night, and may we wake up to fresh mercies.",
    "For every battle we survived today, and every door we did not even know He opened, we say thank You, Lord.",
    "May our evening be peaceful, our homes be safe and our sleep be sweet tonight.",
    "Whatever today left unfinished, may grace complete it, and may we rest without fear or worry.",
    "May God keep watch over our homes and our loved ones tonight.",
  ],
};

// Date.getDay(): 0 = Sunday ... 6 = Saturday. Sunday is treated as the
// first day of the week here (the "new week" theme sits on Sunday, not
// Monday), matching how the week is reckoned for these greetings.
export const THEMES = {
  0: { // Sunday: worship, rest, a fresh week ahead
    wish: "Happy new week",
    reflections: [
      "Sunday has a way of slowing us down. After all the rushing and hustling of the past week, it reminds us to sit, breathe and say thank you for the breath we still have.",
      "Not everyone who started last week is here to see this Sunday. That alone is reason enough to lift our hands and give thanks.",
      "Today we gather in churches, in homes and in quiet corners to thank God for how far He has brought us, even when the road was not smooth.",
      "A new week is another blank page, and none of us writes it alone. Today we hand the pen to the One who knows the end from the beginning.",
      "Whether we are in a packed auditorium or praying quietly at home, Sunday reminds us that we are held by someone greater than our worries.",
      "The week ahead may look crowded with bills, deadlines and responsibilities, but we do not walk into it alone.",
      "Today is a good day to forgive, to let go of last week's disappointments and to walk into the new week lighter.",
      "Sunday reminds us that our strength was never really ours. It is given, and it is renewed.",
    ],
    prayers: [
      "Lord, we thank You for the gift of life. Receive our worship today, and let Your peace follow us into the new week.",
      "May the week ahead be kind to us. May Your favour speak for us in every office, shop, school, farm and home.",
      "Father, go before us this week. Order our steps, protect our going out and our coming in, and let no evil befall us.",
      "May every prayer we lifted today find an answer, and may the testimonies we have been waiting for finally arrive.",
      "Let this new week bring us good health, open doors, divine provision and peace in our homes and in our nation.",
      "May the grace that carried us last week carry us even further in this one.",
      "Lord, make this a week of breakthrough for us and for everyone we love.",
      "May we walk into this week with joy, and may joy be waiting for us at the end of it.",
    ],
  },
  1: { // Monday: momentum, strength
    wish: "Happy Monday",
    reflections: [
      "Monday arrives with traffic, tight schedules and long to-do lists, but it also arrives with fresh opportunity.",
      "The start of a work week can feel heavy. Yet every successful week began with someone deciding to get up and try again.",
      "Whatever we are chasing this week, whether it is a contract, an exam result, a job or simple peace of mind, it is worth stepping out for.",
      "None of us knows what this week holds, which is exactly why we hold on to the God who does.",
      "Many are heading out today with more hope than money and more faith than certainty. May that faith never be put to shame.",
      "The hustle is real, but so is grace. We need both to make it through the week.",
      "Today we start again, and starting again is itself a form of courage.",
      "Behind every busy road and crowded bus today are people praying for a good week, and we are among them.",
    ],
    prayers: [
      "Lord, let us not labour in vain this week. Let every effort of our hands be met with increase.",
      "May doors that were shut open this week, and may anything that should stay closed stay closed in peace.",
      "Father, give us strength for the tasks, wisdom for the decisions and patience for the people we will meet along the way.",
      "May Your favour go ahead of us into every office, meeting, shop and interview this week.",
      "May we meet kind people, good news and divine connections everywhere we go this week.",
      "Lord, keep us safe on the roads, calm in our minds and steady in our work this week.",
      "Let this be the week when things begin to turn around for us.",
      "May our work be fruitful, our rewards be timely and our rest be sweet.",
    ],
  },
  2: { // Tuesday: diligence
    wish: "Happy Tuesday",
    reflections: [
      "Tuesday is the quiet middle of the grind, when the excitement of Monday has worn off and only commitment remains.",
      "Consistency rarely gets applause, but it quietly builds the lives and businesses we are proud of.",
      "There is dignity in showing up again, doing the work and trusting that it counts, even when nobody is watching.",
      "Progress often looks small on the day we are living it, but small steps are still steps forward.",
      "Many of the things we are praying for will come through patient, honest effort and the grace of God working together.",
      "The seeds we sow today may not sprout this week, but none of them will be wasted.",
      "Some days the best we can do is keep going, and that is enough.",
      "Behind every answered prayer there are usually early mornings and unseen effort. Today is another of those days.",
    ],
    prayers: [
      "Lord, bless the work of our hands today, and let nothing we do be wasted.",
      "May strength not fail us and may weariness not win. Give us the grace to finish well today.",
      "Father, let our diligence be rewarded openly, and may Your favour make a way where there seems to be no way.",
      "May every honest effort we make today attract divine help and unexpected support.",
      "Let the seeds we are sowing in tears turn into harvests of joy in due season.",
      "Keep us steady, Lord, and let our season of harvest come sooner than we expect.",
      "May the Lord establish us, and may our labour put food on our tables and joy in our hearts.",
      "Father, give us clear minds, willing hands and good health to accomplish all that is before us today.",
    ],
  },
  3: { // Wednesday: wisdom, midweek
    wish: "Happy midweek",
    reflections: [
      "We are halfway through the week. Some of us are tired, some are encouraged, and all of us are still standing by grace.",
      "Midweek is a good moment to pause, catch our breath and ask whether we are going where we truly want to go.",
      "Wisdom is not only knowing what to do, but also knowing when to wait, when to speak and when to keep quiet.",
      "Many of the decisions that shape our lives are made on ordinary days like this one, and we need more than our own understanding.",
      "It is okay to slow down for a moment. Resting is not quitting, and the finish line is still within reach.",
      "Our plans are important, but so is the humility to ask for direction and to listen.",
      "Looking back over the first half of this week, there is already something to thank God for.",
      "The right word, the right door and the right person at the right time are gifts we cannot manufacture. We can only ask.",
    ],
    prayers: [
      "Lord, grant us wisdom in every decision we make today, big or small.",
      "May the Spirit of God guide our words, our choices and our dealings today.",
      "Father, refresh our strength in the middle of this week and renew our hope.",
      "Let good counsel find us, and give us the humility to receive it.",
      "May clarity replace confusion, and peace replace anxiety, in every area of our lives.",
      "Lord, show us the next step, and give us the courage to take it.",
      "May we not walk through any wrong door or make any costly mistake. Direct our paths, O Lord.",
      "May the second half of this week be even better than the first.",
    ],
  },
  4: { // Thursday: gratitude
    wish: "Happy Thursday",
    reflections: [
      "Gratitude changes how a day feels. Not because our problems vanish, but because we begin to notice what is still good.",
      "There is always something to thank God for: breath in our lungs, a roof over our heads, people who love us and a chance to try again.",
      "Some of the things we once prayed for with tears are now things we take for granted. Today, let us remember.",
      "We may not have everything we want, but we have been kept through so much. That deserves a heartfelt thank you.",
      "Thankfulness is not pretending that things are perfect. It is choosing to see the hand of God in the middle of imperfection.",
      "The week is nearly over, and we are still here. That is no small thing.",
      "Think of the dangers we never saw, the accidents that did not happen and the doors God closed to protect us without our knowing.",
      "A grateful heart is a peaceful heart, and peace is worth more than many of the things we chase.",
    ],
    prayers: [
      "Father, we thank You for life, for health, for family and for every mercy we cannot even count.",
      "Lord, receive our thanks, and let every blessing we have received be multiplied.",
      "May our mouths never run dry of praise, and may You give us more reasons to celebrate.",
      "Thank You, Lord, for being faithful when we were not, and for carrying us when we could not carry ourselves.",
      "May the joy of the Lord be our strength today, and may it overflow to everyone around us.",
      "Let our gratitude open the door to greater testimonies.",
      "Lord, as we thank You for what You have done, we trust You for what You are yet to do.",
      "May our homes be filled with laughter, our tables with food and our hearts with contentment.",
    ],
  },
  5: { // Friday: grace, closing the week well
    wish: "Happy Friday",
    reflections: [
      "We have made it to Friday, and by God's grace we are still standing.",
      "This week had its pressures, its delays and its disappointments, yet here we are, carried through every one of them.",
      "Friday is an invitation to slow down, to be thankful for what was achieved and to forgive ourselves for what was not.",
      "Not every plan worked out this week, but nothing was wasted. God can use even the things that did not go as we hoped.",
      "As the week closes, many of us are travelling, packing up or heading home to family. May every journey be a safe one.",
      "Rest is not a reward for the perfect. It is a gift for the weary.",
      "Whatever this week left unfinished, grace can complete.",
      "Another week of life, and another reason to say thank You, Lord.",
    ],
    prayers: [
      "Lord, let Your mercy cover every shortfall of this week and every unfinished task.",
      "May all who are travelling this weekend reach their destinations safely, and may our roads be free from accidents and trouble.",
      "Father, give us rest that truly refreshes, and joy that does not depend on our circumstances.",
      "May the good things we prayed for this week be waiting for us when we open our eyes.",
      "Let peace rule in our homes this weekend, and let our families be filled with love.",
      "May we finish this week strong, with testimonies in our mouths and gratitude in our hearts.",
      "Lord, close this week with good news for us, and open the next with greater things.",
      "May the weekend be gentle with us and full of reasons to smile.",
    ],
  },
  6: { // Saturday: rest, family, celebration
    wish: "Happy Saturday",
    reflections: [
      "Saturdays in our country are full of life: weddings, naming ceremonies, football, errands, family visits and the sweet sound of rest after a long week.",
      "The weekend reminds us that life is not only about work. It is also about people.",
      "Take a moment today to call someone you have not spoken with in a while. A simple greeting can lift a heavy heart.",
      "Whether we are travelling, celebrating or just sitting at home with our feet up, today is a gift.",
      "Rest is part of the work. Our bodies, minds and spirits need it, and God is not displeased when we take it.",
      "Many of us have been on the move all week. Today we can finally breathe, laugh and enjoy what we worked so hard for.",
      "Family, friends and good food are small things that make life rich.",
      "Tomorrow many of us will worship, but today we can simply enjoy the peace of being alive.",
    ],
    prayers: [
      "Lord, bless our homes today. Let there be peace, laughter and unity in every family.",
      "May all our celebrations be joyful and safe, and may every gathering end with good testimonies.",
      "Father, protect all who are on the road today. May we hear no bad news, and may everyone reach their destination safely.",
      "May our rest today restore our bodies, renew our minds and refill our hearts.",
      "Let every good thing we have laboured for this week begin to show itself.",
      "May the Lord bless our families, our friendships and the work of our hands.",
      "May the joy we taste today be only a small preview of the greater joy ahead.",
      "Lord, let us rest well tonight and wake up ready for the new week.",
    ],
  },
};

// Used only on the 1st of each month, in place of the day-of-week theme.
// Nigerian custom: "Happy New Month" prayers on day one. Use {month} for the
// month name.
const NEW_MONTH_THEME = {
  wish: "Happy New Month",
  reflections: [
    "A new month is a gift not everyone lived to see. We are grateful to be here to welcome {month}.",
    "We say goodbye to the last month with its struggles and its blessings, and we step into {month} with hope.",
    "Every new month is a new chapter, and we do not have to carry yesterday's disappointments into it.",
    "Welcoming {month} reminds us that the God who brought us through the past weeks is not done with us.",
    "Many of us enter {month} with unanswered prayers, pending bills and unfinished plans, but also with a faith that refuses to give up.",
    "The first day of the month is a reset: a chance to pray bigger, plan wiser and trust deeper.",
    "As we begin {month}, let us remember how many battles we have already won.",
    "{month} has not yet written its story. Let us ask God to be its author.",
  ],
  prayers: [
    "Lord, we declare that {month} will be a month of mercy, favour and open doors for us.",
    "May every good thing we have been waiting for arrive this month, and may every delay turn into double honour.",
    "Father, let this month be better than the last in health, in finances, in joy and in peace.",
    "May there be no sorrow, no loss and no evil report in our homes this month.",
    "May we see divine breakthroughs, unexpected help and supernatural provision throughout {month}.",
    "Lord, bless our going out and our coming in every day of this month, and keep us safe from every danger.",
    "May our businesses prosper, our careers advance and our families be at peace this {month}.",
    "May this month announce good news about us, and may we end it with songs of thanksgiving.",
  ],
};

// Simple, dependency-free string hash so each "random" pick is deterministic
// per contact+day+slot (stable if you reload the page) but varies across
// contacts, across days, and across the message slots, without needing to
// store anything extra.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick(list, seed) {
  return list[hashString(seed) % list.length];
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
  const tod = timeOfDay();
  const seed = contact.phone + '|' + fmtDateKey(viewDate);

  const opener = pick(OPENERS, seed + '|opener')
    .replace(/{tod}/g, tod)
    .replace(/{wish}/g, theme.wish);
  const reflection = pick(theme.reflections, seed + '|reflection');
  const prayer = pick(theme.prayers, seed + '|prayer');
  const timePrayer = pick(TIME_PRAYERS[tod], seed + '|time');
  const amen = pick(AMENS, seed + '|amen');
  const wellWish = pick(WELL_WISHES[tod], seed + '|wish');
  const closer = pick(CLOSERS, seed + '|closer');

  const month = MONTH_NAMES[viewDate.getMonth()];
  const message = [
    `*${opener}*`,
    reflection,
    `${prayer} ${timePrayer}`,
    `${amen} ${wellWish} ${closer}`,
  ].join('\n\n');

  return message.replace(/{month}/g, month);
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
