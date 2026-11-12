/**
 * Greeting engine.
 *
 * Every message is a short, prayerful note written from a Nigerian point of
 * view. It is assembled from independently chosen pieces:
 *
 *   1. an opener that greets for the time of day and the day itself
 *   2. optional extras: a friendly check-in and a line about the season
 *   3. a reflection that fits the day's theme
 *   4. a prayer for the day, and a prayer for the time of day
 *   5. an "Amen", a short well-wish for the time of day and closing emoji
 *
 * Each message also picks one of five "shapes" (full, short, lead, double,
 * brief), so some are long and some are quick. On top of the hand-written
 * prayers, a prayer builder joins invocations, requests and endings, which
 * adds thousands more prayers. Together this gives many millions of different
 * messages.
 *
 * The wording speaks as "we" and "us", so it reads naturally for anyone,
 * whether they are older, younger, family or someone you barely know. There
 * are no Bible verses and the recipient's name is never used.
 *
 * Picks are deterministic per contact and date, so reloading the page shows
 * the same message, while different people and different days vary.
 *
 * To add your own wording, copy any line inside a list, change the words
 * between the quote marks and keep the comma at the end. Special words:
 *   {tod}   morning, afternoon or evening
 *   {wish}  the day's greeting, such as "Happy Monday"
 *   {month} the month name
 */

// ---------------------------------------------------------------- Openers
const OPENERS = [
  "Good {tod}! {wish}.",
  "{wish}, and good {tod} to you!",
  "Good {tod} to you and your household. {wish}!",
  "Good {tod}, dear one. {wish}!",
  "A very good {tod} to you. {wish}!",
  "Good {tod}! Trust you are keeping well. {wish}!",
  "{wish}! Good {tod} to you and your loved ones.",
  "Good {tod}! Hope you are doing great. {wish}.",
  "{wish}! Wishing you a wonderful {tod}.",
  "Good {tod}, and {wish} to you and yours!",
  "Warm greetings this {tod}. {wish}!",
  "{wish}! A blessed {tod} to you.",
  "Good {tod}, my dear. {wish}!",
  "Greetings this {tod}! {wish}, and God bless you.",
  "A lovely {tod} to you. {wish}!",
  "Good {tod}! Sending you my warmest wishes. {wish}!",
  "{wish}! How is the {tod} treating you?",
  "Good {tod} to you and the family. {wish}!",
  "Hello, and a good {tod} to you! {wish}.",
  "{wish} and good {tod}! Thinking of you today.",
  "Good {tod}, and {wish}! Hope all is well with you.",
  "A peaceful {tod} to you. {wish}!",
  "Good {tod}! {wish}, and may it be a good one.",
  "{wish}! Good {tod}, and God bless your home.",
  "Good {tod}, beloved. {wish}!",
  "Good {tod} and {wish}! Trust you and yours are well.",
  "Compliments of the day! {wish}, and good {tod}.",
  "Good {tod}! Just checking in with a warm {wish}.",
  "{wish}! May this {tod} treat you kindly.",
  "A joyful {tod} to you. {wish}!",
  "Good {tod}! You came to mind, so here is a {wish} from me.",
  "Good {tod}, and {wish}! Hope you are well and in good spirits.",
];

// An optional emoji before the opener. Empty entries mean "none".
const OPENER_ICONS = {
  morning: ["", "", "☀️", "🌅", "🌞", "🌤️"],
  afternoon: ["", "", "🌤️", "☀️", "🌻", "🌼"],
  evening: ["", "", "🌙", "🌆", "🌇", "✨"],
};

// A friendly check-in, used in some shapes.
const CHECKINS = {
  morning: [
    "Trust you slept well.",
    "Hope you woke up refreshed.",
    "Hope you had a restful night.",
    "I hope your morning is off to a gentle start.",
    "Hope you are ready for the day ahead.",
    "Trust you woke up in good health.",
  ],
  afternoon: [
    "Hope your day is going well so far.",
    "Trust the day has been kind to you.",
    "Hope you have found a moment to breathe today.",
    "I hope the afternoon is treating you gently.",
    "Hope you have eaten and are taking care of yourself.",
    "Trust all is well with you this afternoon.",
  ],
  evening: [
    "Hope the day treated you kindly.",
    "Trust you got home safe and sound.",
    "Hope you have had a good day.",
    "I hope you are winding down and getting some rest.",
    "Trust you have had something good to eat.",
    "Hope the evening finds you well and at peace.",
  ],
};

// An optional line about the weather or season. Keyed by month (0 = January).
const SEASON_LINES = {
  dry: [
    "The harmattan is around, so keep warm, drink enough water and take care of your skin and chest.",
    "With the dust and dry air of the harmattan, please look after your health.",
    "Cold mornings and dusty afternoons call for extra care. Stay warm and well hydrated.",
    "If you are heading out in the harmattan haze, please drive and walk with extra care.",
  ],
  hot: [
    "The heat is intense these days, so drink plenty of water and rest when you can.",
    "It is really hot out there. Please stay hydrated and take it easy.",
    "May the Lord cool every heat around us, outside and within.",
  ],
  rain: [
    "With the rains around, may we stay safe, dry and well.",
    "As the rain falls, may it wash away every worry and water every good seed we have sown.",
    "If you are out in the rain today, please travel with care and watch out for floods.",
    "The rains are here. May they bring us fresh hope and not trouble.",
  ],
};
const SEASON_BY_MONTH = ['dry', 'dry', 'hot', 'rain', 'rain', 'rain', 'rain', 'rain', 'rain', 'rain', 'dry', 'dry'];

// A short lead-in to a prayer. Empty entries mean "none".
const BRIDGES = [
  "", "", "", "",
  "Let us pray.",
  "So today we pray:",
  "With that in mind, we pray:",
  "Together we say:",
  "Let us ask for grace:",
  "Let this be our prayer:",
  "And so we ask:",
  "We lift this prayer:",
];

// ----------------------------------------------------------------- Closings
const AMENS = [
  "Amen.",
  "In Jesus' name, amen.",
  "This is our prayer. Amen.",
  "And we say a big Amen!",
  "We receive it. Amen.",
  "Let it be so, in Jesus' name. Amen.",
  "Amen and amen.",
  "In Jesus' mighty name, amen.",
  "We say Amen, and we receive it.",
  "So shall it be. Amen.",
  "It is well, and it shall be well. Amen.",
  "We hold on to this by faith. Amen.",
  "May it be so, Lord. Amen.",
  "To God be the glory. Amen.",
  "We believe it. Amen.",
  "Amen, and thank You, Lord.",
  "We seal it in Jesus' name. Amen.",
  "That is our prayer. Amen!",
  "Let all who agree say Amen!",
  "Done, in Jesus' name. Amen.",
];

// A short well-wish that ends the message, matched to the time of day.
const WELL_WISHES = {
  morning: [
    "Have a blessed and productive day ahead.",
    "Go well today, and may joy find you on the way.",
    "Wishing you a bright, safe and fruitful day.",
    "Have a wonderful day, and stay safe out there.",
    "Make today count, and may it be kind to you.",
    "May your day be full of good surprises.",
    "Wishing you strength for the day and joy along the way.",
    "Go and have a great one.",
    "Have a smooth and successful day.",
    "Step out with confidence today. You are covered.",
    "Enjoy every good moment of today.",
    "Have a gentle start and a victorious finish.",
    "Wishing you a day that ends better than it began.",
    "Take care of yourself today.",
    "Walk into this day with a smile.",
    "Have a beautiful day ahead.",
  ],
  afternoon: [
    "Have a blessed and peaceful rest of the day.",
    "Keep going, and may the rest of your day be lighter than the start.",
    "Wishing you a calm, safe and fruitful afternoon.",
    "Enjoy the rest of your day.",
    "Take a moment to breathe, then finish strong.",
    "Hope the rest of today goes smoothly for you.",
    "Wishing you a pleasant afternoon and an easy finish.",
    "Have a productive afternoon, and do not forget to eat and drink water.",
    "May the rest of your day bring you good things.",
    "Keep your head up, the best part of the day is still coming.",
    "Have a lovely afternoon.",
    "Go gently through the rest of today.",
    "Wishing you strength to finish what is on your plate.",
    "Take care of yourself this afternoon.",
    "Have a smooth rest of the day.",
    "May your afternoon be easy and your evening be sweet.",
  ],
  evening: [
    "Have a restful and peaceful evening.",
    "Rest well tonight, and wake up to joy.",
    "Wishing you a calm evening and a sweet night's sleep.",
    "Have a lovely evening with the people you love.",
    "Relax, you have done enough for today.",
    "Sleep well, and wake up refreshed.",
    "Enjoy a quiet, peaceful night.",
    "Wishing you a calm night and a bright tomorrow.",
    "Take it easy this evening. You deserve the rest.",
    "May your night be restful and your dreams be sweet.",
    "Unwind, give thanks and sleep in peace.",
    "Have a gentle evening and a good night.",
    "Good night in advance, and God keep you.",
    "Put your feet up and let go of today.",
    "Have a cosy night and wake up to good news.",
    "Rest well, and see you in a brighter tomorrow.",
  ],
};

const CLOSERS = [
  "🙏", "🌿", "✨", "🙌", "💛", "🌟", "😊", "🕊️",
  "☀️", "❤️", "🌻", "🙂", "🌸", "🤝",
  "💫", "🌼", "💐", "🤗", "😇", "🌺", "🧡", "💙",
  "🌈", "🌷", "🕯️", "🫶", "🙏🏽", "🙏🏾", "🌹", "⭐",
];

// ----------------------------------------------------------- Time prayers
// A prayer matched to the time the message is opened.
const TIME_PRAYERS = {
  morning: [
    "As we step out this morning, may God order our steps, shield us on every road and bring us back home safe.",
    "May the Lord who kept us through the night go before us today and make every crooked path straight.",
    "May our morning hustle meet divine favour, and may no door we knock on be shut against us.",
    "May this morning's light bring good news, fresh strength and open doors.",
    "May we leave our houses in peace and return in joy, with testimonies to share.",
    "Whatever we are facing this morning, may the mercy of God speak for us.",
    "Thank You, Lord, for waking us up this morning. May every hour of today be covered by Your grace.",
    "May the dew of a new morning refresh our spirits, and may no weight from yesterday follow us into today.",
    "May the first hours of this day set the tone for good things all through it.",
    "As the sun rises on us, may favour rise on every area of our lives.",
    "May we meet kind faces, good news and smooth roads from the moment we step out.",
    "Let this morning be the beginning of something better than we have ever seen.",
    "May the God who woke us up also walk with us through every hour of today.",
    "May our mornings always be full of mercy, and may none of our days begin in fear.",
    "May our early efforts today return to us as lasting rewards.",
    "May the peace of God guard our thoughts this morning and settle every anxious heart.",
  ],
  afternoon: [
    "As the day wears on, may God renew our strength and keep us from every weariness of body and mind.",
    "May the rest of today bring us good news, unexpected favour and a calm heart.",
    "In the heat of the afternoon, may the Lord be our shade and our provider.",
    "May no pressure of today weigh us down; may grace carry us to the finish line of the day.",
    "May God finish what He started in our hands today and let it speak well for us.",
    "Wherever this afternoon finds us, in traffic, at the office, in the market or at home, may the peace of God find us there too.",
    "May the second half of today be sweeter than the first, and may every unfinished task find its completion.",
    "If this day has been heavy so far, may the Lord lighten it and turn the afternoon around for good.",
    "May the strength we started the day with be renewed, and may we finish well.",
    "May our afternoon be free of delays, quarrels and bad news.",
    "As we pause for a moment today, may God fill us again with peace and courage.",
    "May the favour of God meet us in every meeting, every errand and every conversation this afternoon.",
    "May we not tire of doing good, and may due season bring its reward.",
    "May this afternoon hold good surprises, and may every worry we carried lose its grip on us.",
    "Lord, be our rest in the middle of the rush, and our joy in the middle of the work.",
    "May the rest of today be safe, smooth and fruitful for us and everyone we love.",
  ],
  evening: [
    "As the day closes, may God gather us safely home and turn today's tiredness into thanksgiving.",
    "May the Lord who brought us through today keep us through the night, and may we wake up to fresh mercies.",
    "For every battle we survived today, and every door we did not even know He opened, we say thank You, Lord.",
    "May our evening be peaceful, our homes be safe and our sleep be sweet tonight.",
    "Whatever today left unfinished, may grace complete it, and may we rest without fear or worry.",
    "May God keep watch over our homes and our loved ones tonight.",
    "Thank You, Lord, for bringing us to the end of this day. Cover us as we rest and wake us with joy.",
    "May every worry we carried today be left at the feet of Jesus, and may we sleep without fear.",
    "As the lights come on in our homes tonight, may the light of God's peace fill every room.",
    "May no harm come near us tonight, and may we wake up to a morning brighter than we hoped.",
    "For the strength to start, the grace to continue and the mercy to finish, we give thanks this evening.",
    "May our dreams tonight be sweet, our rest be deep and our waking be full of promise.",
    "May the God who neither slumbers nor sleeps stand guard over us tonight.",
    "May the burdens of today dissolve as we rest, and may tomorrow meet us with new strength.",
    "May we close this day with gratitude, forgive what needs forgiving and sleep in peace.",
    "Let the evening bring us rest, laughter and the warmth of the people we love.",
  ],
};

// ----------------------------------------------------- Prayer builder
// Joins an invocation, a request and an ending into a full prayer. Every
// request begins with a verb, so it fits all of the frames below.
const INVOCATIONS = [
  "Lord,", "Father,", "Dear God,", "Heavenly Father,",
  "Gracious God,", "Faithful Father,", "Lord of mercy,", "Almighty God,",
];

const PRAYER_FRAMES = [
  "{inv} {req}{tail}",
  "{inv} {req}{tail}",
  "We ask You, Lord, to {req}{tail}",
  "Please, {inv} {req}{tail}",
  "{inv} we trust You to {req}{tail}",
];

const PRAYER_REQUESTS = [
  "keep us safe on every road we travel",
  "let Your favour go ahead of us",
  "bless the work of our hands and prosper our plans",
  "fill our homes with peace and our hearts with joy",
  "open doors that no one can shut",
  "send us good news we did not expect",
  "guard our health and strengthen our bodies",
  "supply every need we carry, according to Your riches",
  "turn every delay into double honour",
  "protect our families from every harm, seen and unseen",
  "give us wisdom for every choice we must make",
  "heal every wound that no one else can see",
  "let no evil report come near our dwelling",
  "surround us with kind people and divine helpers",
  "calm every anxious thought and restore our rest",
  "let our hustle meet Your blessing",
  "make a way where there seems to be no way",
  "renew our strength when we grow weary",
  "answer the prayers we have prayed in secret",
  "let our light shine so that others find hope in us",
  "keep our minds clear and our hearts humble",
  "lift every burden we have carried too long",
  "let goodness and mercy follow us all our days",
  "bring our loved ones home safe and whole",
  "restore whatever the years have stolen from us",
  "give us joy that no worry can take away",
  "make us a blessing to everyone we meet",
  "settle every quarrel and bring peace where there is tension",
  "pour Your grace on our children and the young ones we love",
  "cover our parents and elders with good health and honour",
];

const PRAYER_TAILS = [
  ".", ".", " today.", " this {tod}.", " in Your mercy.",
  " for us and for those we love.", " and let it show for all to see.",
  " and let us not be ashamed.",
];

// -------------------------------------------------- General reflections
// Thoughts that fit any ordinary day. They are mixed in with each day's own.
const GENERAL_REFLECTIONS = [
  "Life is a gift we did not earn, which is why gratitude never goes out of fashion.",
  "Not every blessing arrives loudly. Some come quietly, through ordinary days and familiar faces.",
  "A kind word costs nothing, yet it can carry someone through a hard day.",
  "Strength is not the absence of tears. It is getting up again with God's help.",
  "What God has started in our lives, He is faithful to finish.",
  "Not every closed door is a rejection. Some are redirections.",
  "We are more than our worries, and we are surrounded by more grace than we notice.",
  "Small victories deserve to be celebrated too: a bill paid, a safe trip, a good conversation, a quiet heart.",
  "The same God who kept us yesterday is not tired today.",
  "Peace is not found in perfect circumstances. It is found in trusting the One who is greater than them.",
  "People may forget what we did for them, but God never forgets a single act of kindness.",
  "Hope is a decision we make again every day, and it is always worth making.",
  "Patience is not wasted time. It is time in which God is working.",
  "There is no distance too far for prayer to cover, and no one too small to be remembered by God.",
  "Good friends and a clear conscience are riches no bank can hold.",
  "We cannot control every outcome, but we can choose to trust, to be kind and to keep moving.",
  "Our story is still being written, and the best chapters may not have arrived yet.",
  "Even on days when we feel we are barely coping, we are still being carried.",
  "Some of the greatest miracles are the ones that never made the news: the accident that did not happen, the sickness that passed us by.",
  "It is easy to count what we lack. It is wiser to count what we still have.",
  "The people who pray for us, often without our knowing, are among our greatest blessings.",
  "God is never early and never late. His timing is exact.",
  "A grateful heart finds something to smile about even on the hardest day.",
  "We are not defined by our worst day, nor by our delays. We are defined by the grace that finds us.",
];

// ----------------------------------------------------------------- Themes
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
      "There is a special peace on a Sunday: the choir, the offering, the handshake and the sermon that arrives just when we need it.",
      "Before the week begins to demand things of us, Sunday asks us to simply be still and be thankful.",
      "Many of us have prayers we carried into last week and are carrying into this one. Sunday reminds us that God has not forgotten a single one.",
      "Dressed in our best or resting in our simplest, Sunday welcomes us exactly as we are.",
      "A new week does not need to be perfect. It only needs us to begin it with God.",
      "The best way to start a week is not with a plan but with a prayer, and then the plan makes more sense.",
      "Today is a day to sing, even off key, and to rest, even if only for an hour.",
      "Another Sunday means another chance to be grateful for mercies that were new every single morning.",
      "Let us put down last week's stress at the door today. The new week deserves a fresh heart.",
      "Rest is holy, and Sunday is a gentle reminder that we were never meant to carry everything alone.",
      "Some of us will be in the pulpit, some in the choir, some in the car park and some in bed with a cup of tea. All of us are loved.",
      "A new week brings new strength, new chances and new reasons to trust.",
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
      "Father, let the word we heard today take root and bear fruit all through the coming week.",
      "May every church service, every prayer meeting and every quiet devotion today bring down fresh strength from above.",
      "Lord, let this week begin with peace and end with testimonies.",
      "May our homes be filled with Your presence this week, and may no quarrel find a place in them.",
      "May we sow kindness this week and reap a harvest of favour.",
      "Father, set the tone for this week with Your mercy, and let every day carry its own blessing.",
      "May our new week be full of divine connections, good health and joy that lasts.",
      "Lord, we place the whole week in Your hands. Do with it what only You can do.",
      "May the new week announce us for good, and may our names be spoken with honour in places we have never been.",
      "May we find rest for our souls today, and strength for every road in the days ahead.",
      "May the new week be safe from accidents, free from sickness and rich in answered prayers.",
      "Father, let this week be the beginning of a season of great things for us.",
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
      "Monday does not have to be dreaded. It can be a doorway to the things we have been praying for.",
      "Before the emails, the calls and the meetings begin, a quiet prayer can set the whole week straight.",
      "Some of us woke up today with a heavy heart. Monday is a good day to hand it over and walk lighter.",
      "A week is just seven chances to do a little better, and today is the first one.",
      "The alarm may be unwelcome, but being alive to hear it is a blessing.",
      "Every business owner, student, trader, driver, nurse and teacher begins today with the same hope: let this week be good.",
      "Hard work is honourable, and so is the courage to begin the week when we would rather stay in bed.",
      "Momentum is built one Monday at a time. Today we take the first step.",
      "Whatever we could not finish last week does not have to follow us in with a frown. We carry it in with grace.",
      "The road may be long this week, but we have a Companion who does not get tired.",
      "A good Monday is not one without challenges. It is one where we meet them with faith.",
      "Something good is waiting for us this week, and we have not even seen it yet.",
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
      "Father, let this Monday begin a week of progress, not pressure.",
      "May every contract, application and proposal we have sent out find favour this week.",
      "Lord, let our businesses grow, our salaries stretch and our needs be met all through this week.",
      "May we receive good news before this week is over.",
      "Father, bless every student, trader, worker and traveller who steps out today.",
      "May our minds be sharp, our schedules smooth and our hearts at peace this week.",
      "Lord, let our efforts this week sow seeds for years of harvest.",
      "May no setback this week be able to stop us, and may every obstacle become a stepping stone.",
      "May the Lord who began a good work in us carry it on this week to completion.",
      "May our week be free from accidents, quarrels and loss, and full of laughter and gain.",
      "Father, make us a blessing at work this week, and make work a blessing to us.",
      "May the strength of the Lord carry us from this Monday to the very end of the week.",
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
      "The glamour of a new week has faded, and what is left is the real work. That is where character is built.",
      "Nobody celebrates a Tuesday, yet most of life is made of ordinary days faithfully lived.",
      "Discipline is simply love for the future version of ourselves, and today we show it again.",
      "It is not about doing everything today. It is about doing the next right thing well.",
      "Great things are rarely built in a day, but every great thing was built one day at a time.",
      "The steady ones often finish first. Let us keep our pace today.",
      "Tuesday may not feel special, but the God who walks with us is just as present as on any other day.",
      "Every task done with honesty today is a quiet testimony in the making.",
      "We may be tired, but we are not finished. There is more in us than we know.",
      "Sometimes faith looks like simply getting on with the work in front of us.",
      "What looks like routine to us is often the very thing preparing us for something bigger.",
      "Effort and grace are not rivals. They walk together.",
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
      "Lord, let our consistency attract rewards that surprise us.",
      "May every task on our table today be completed with ease and excellence.",
      "Father, give us the stamina to keep going when the excitement has faded.",
      "May our small beginnings become testimonies that astonish us.",
      "Lord, order our time today, and let us find space for what truly matters.",
      "May our integrity today be rewarded with trust, opportunities and peace.",
      "Father, let the work we do quietly today speak loudly for us in due time.",
      "May the Lord multiply the little we have and make it more than enough.",
      "May no effort of ours today return empty. Let every labour bear fruit.",
      "Lord, may our hands never be too weak and our hearts never be too weary to do good.",
      "Father, bring helpers, resources and ideas across our path today.",
      "May the grace to endure be ours today, and the joy of completion follow.",
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
      "Midweek is the hump of the week. Once we are over it, the road starts sloping our way.",
      "Smart people ask for advice, but wise people ask God first.",
      "Halfway through is a good place to adjust our sails without abandoning the journey.",
      "Not every question needs an answer today. Some answers come only after we have waited and prayed.",
      "The mid-point of the week is a quiet reminder that we have already come further than we thought.",
      "We often pray for answers, but sometimes what we need most is clarity about the question.",
      "Wisdom grows in the pauses: the deep breath before a reply, the prayer before a purchase, the walk before a decision.",
      "When we are unsure which way to go, the first step is to be still and listen.",
      "Good counsel is a gift, and humility is the hand that receives it.",
      "Let us celebrate how far this week has taken us, and trust it for the rest of the way.",
      "A tired body does not mean a failing spirit. Midweek fatigue is just a sign that we have been working.",
      "Discernment is a quiet treasure. It keeps us out of trouble we never even knew existed.",
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
      "Father, give us discernment to know the right people, the right timing and the right path.",
      "May every confusion in our minds clear up today, and may every hard choice become simple.",
      "Lord, let us speak with wisdom, listen with patience and act with kindness today.",
      "May every closed door be explained, and every open door be wisely entered.",
      "Father, give us a calm mind in a noisy world.",
      "May the Lord guard us from hasty words and regrettable decisions today.",
      "May we receive the right advice at the right time from the right person.",
      "Lord, restore the energy we have spent, and carry us strongly to the weekend.",
      "May divine ideas come to us today, and may we have the wisdom to act on them.",
      "Father, lead us beside quiet waters in the middle of this busy week.",
      "May every plan that is not from You fall away, and every plan that is be established.",
      "May the Lord renew our minds today and fill us with understanding.",
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
      "Thursday is a good day to say thank you to someone we have taken for granted, and to the God who sent them.",
      "Gratitude turns what we have into enough, and enough into abundance.",
      "If we listed every good thing that has happened to us this year, we would run out of paper before we ran out of blessings.",
      "Some of our greatest blessings arrive wearing the clothes of hard work and long waiting.",
      "A simple meal, a working phone, a safe bed and a friend who calls are treasures that many are still praying for.",
      "We do not thank God because everything is easy. We thank Him because He is good.",
      "Gratitude is a muscle. The more we use it, the stronger our joy becomes.",
      "There are people who would gladly swap places with us today. Let that thought make us humble and thankful.",
      "Let us thank God for the lessons we did not enjoy, because they made us who we are.",
      "Every sunrise we have seen this week was a gift, and not one of them was guaranteed.",
      "When thanksgiving comes before the breakthrough, faith is at its strongest.",
      "Looking back, how many times has God come through when we did not see how? That is reason enough to give thanks.",
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
      "Lord, we thank You for the answered prayers we have forgotten to celebrate.",
      "Father, teach us to count our blessings and never to count them small.",
      "May a spirit of thanksgiving rest on us today and keep bitterness far from our hearts.",
      "Thank You, God, for the people who love us, forgive us and pray for us. Bless them abundantly.",
      "May our thankfulness today become the seed of tomorrow's miracles.",
      "Father, for every door You opened and every danger You turned away, we say thank You.",
      "Lord, let us never become too busy or too proud to say thank You.",
      "May the God who gives us all things richly give us hearts that overflow with gratitude.",
      "We thank You, Lord, for the strength to get this far in the week. Carry us to the end of it.",
      "May we be so thankful that worry has no room left in us.",
      "Lord, let those who helped us along the way be rewarded openly.",
      "Father, make us generous, as You have been generous to us.",
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
      "There is a particular lightness in the air on a Friday, and it is worth enjoying.",
      "Whether this week was a triumph or a trial, it is nearly behind us, and that is worth a smile.",
      "Friday reminds us that every hard week eventually ends, and every hard season does too.",
      "We worked, we waited, we prayed and we pressed on. That is something to be proud of.",
      "The roads will be busy today, the markets full and the weekend plans many. May every one of us reach where we are going.",
      "Friday prayers, Friday evenings, Friday gatherings: so many people lean on this day for strength and fellowship.",
      "It is okay to close the laptop, put down the burden and let the week go.",
      "Rest is not laziness. It is trust that the world will not fall apart without us for a day or two.",
      "Some of us will celebrate this weekend and some of us will simply rest. Both are good.",
      "At the end of every week, the grace that carried us deserves a mention.",
      "Friday gives us permission to exhale.",
      "A week survived is a week won, and we have won this one by God's mercy.",
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
      "Father, as this week ends, let every burden we carried be lifted.",
      "May our Friday end with answered prayers, good company and a thankful heart.",
      "Lord, protect all who will be on the road, in the air and on the water this weekend.",
      "May every worry from this week stay behind us, and may the weekend bring us peace.",
      "Father, let the grace that carried us this week carry us into the next.",
      "May we find rest, refreshment and renewed strength over the weekend.",
      "Lord, bless every gathering, every meal and every conversation this weekend.",
      "May the Friday feeling stay with us, and may joy walk into our homes tonight.",
      "Father, may no tragedy touch us or our loved ones this weekend.",
      "Lord, wrap up every loose end of this week with Your favour.",
      "May we be refilled, refreshed and ready for the good things ahead.",
      "May this Friday bring us unexpected good news.",
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
      "Saturday is for aso ebi and jollof, for long phone calls and slow mornings, for laughter that rattles the room.",
      "Some of us will be on the road to a wedding, a burial or a family event today. May we reach, celebrate and return safely.",
      "Slow mornings, warm food and the people we love: Saturday has a way of reminding us what matters.",
      "Today is a chance to do something we enjoy without apology.",
      "There is great joy in simple things: a good meal, a long chat, a nap in the afternoon.",
      "Saturday is a good day to visit someone who might be lonely. Your presence is a gift.",
      "A day off is not a day wasted. It is a day that makes the other days possible.",
      "The market, the match, the party and the porch all have their place today.",
      "Let us laugh a little louder today. We have earned it.",
      "The weekend is for catching up with ourselves, with our families and with God.",
      "A free Saturday is a rare treasure. Let us spend it well.",
      "Let the cares of the week fall off today and let the joy of the weekend settle in.",
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
      "Father, let every wedding we attend today be blessed, and every couple be happy for life.",
      "May the food we eat today nourish us, and may the company we keep refresh us.",
      "Lord, comfort every family that is grieving this Saturday, and be near to the lonely.",
      "May we be kind and gracious to everyone we meet today.",
      "Father, bless the children and young people in our lives, and keep them safe in all their play.",
      "May our weekend be restful, joyful and free from trouble.",
      "Lord, let our gatherings be marked by love, and let there be no strife among us.",
      "May the good rest we take today prepare us for the great things ahead.",
      "Father, guard every home tonight, and let peace be in every room.",
      "May the Lord surprise us today with small joys and unexpected kindness.",
      "Lord, bless all who are working this Saturday, and bring them home safe.",
      "May we end this day grateful, rested and at peace.",
    ],
  },
};

// Used on the 1st of each month, in place of the day-of-week theme.
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
    "Some of the people who welcomed last month with us are no longer here. That makes this {month} all the more precious.",
    "A new month is like a fresh sheet of paper. Let us write on it with faith and kindness.",
    "We have crossed into {month} by mercy, not by merit, and that is worth a hearty thank you.",
    "The first day of {month} is an invitation to start again, wiser, kinder and braver.",
    "We carry into {month} everything we learned last month, the sweet and the bitter.",
    "There is something hopeful about a first day. Everything is possible, and nothing is yet spoiled.",
    "Last month had its share of tears and triumphs. Both have prepared us for {month}.",
    "Let us enter {month} with gratitude for what is behind us and expectation for what lies ahead.",
    "In {month}, may the doors we have been knocking on finally swing open.",
    "A new month is proof that God is not finished with the story of our lives.",
    "May we begin {month} with lighter hearts, steadier steps and bigger faith.",
    "We have made it to {month}. Let that sink in, and let us give thanks.",
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
    "Father, let {month} be the month we look back on and say, this is where it all turned around.",
    "May every sickness, every debt and every difficulty come to an end in this new month.",
    "Lord, make {month} a month of laughter, answered prayers and divine surprises.",
    "May this month find us healthy, whole and walking in favour from the first day to the last.",
    "May the God of new beginnings give us a fresh start in {month}.",
    "Let this month be a month of testimonies for us, our families and everyone we love.",
    "May no good thing be withheld from us this {month}, and may no evil come near us.",
    "Father, order our days this month, and let every plan we make be blessed.",
    "May we find favour with God and with people every day of this month.",
    "Lord, let the blessings of {month} follow us to the end of the year.",
    "May the favour that started this month with us never leave us.",
    "May our joy this {month} be complete and our peace be undisturbed.",
  ],
};

// ------------------------------------------------------- Special days
// Fixed holidays and Easter. When a special day falls on the 1st of a month,
// its words are mixed with the new-month words.
const SPECIALS = {
  goodFriday: {
    name: "Good Friday",
    wish: "Blessed Good Friday",
    reflections: [
      "Today we remember the cross, and the love that held Jesus there for our sake.",
      "Good Friday reminds us that there is no pain, shame or sorrow that God does not understand.",
      "At the cross, our burdens were carried, our debts were paid and our hope was secured.",
      "Today is quiet and sober, and it is also the day that made the joy of Sunday possible.",
      "No one loved us more than the One who gave Himself for us. Today we pause to be grateful.",
      "Good Friday invites us to lay down our guilt and receive mercy that is freely given.",
      "The darkest day became the doorway to the greatest victory. Let that comfort us in our own dark days.",
    ],
    prayers: [
      "Lord Jesus, thank You for the cross. Let its love and mercy touch every part of our lives today.",
      "Father, as we remember Your sacrifice, wash us, forgive us and make us new.",
      "May the grace that flowed from Calvary cover our homes, our hearts and our families.",
      "Lord, let us honour this day with reverence and a thankful heart.",
      "May every burden we carry be laid at the foot of the cross today, and may we leave it there.",
      "Lord, where there is sorrow, bring comfort. Where there is guilt, bring forgiveness. Where there is fear, bring peace.",
      "Thank You, Jesus, for loving us to the end. May we love others the way You love us.",
    ],
  },
  easter: {
    name: "Easter",
    wish: "Happy Easter",
    reflections: [
      "He is risen! The tomb is empty, and death does not have the last word.",
      "Easter is God's reminder that no situation is too dead for Him to bring back to life.",
      "The stone was rolled away, and so can every stone that stands in our way.",
      "Easter morning tells us that sorrow may last through the night, but joy comes with the light.",
      "Because He lives, we can face tomorrow. That promise is the heart of this day.",
      "Today we celebrate victory over fear, over sin and over the grave.",
      "Every hope we thought was buried can rise again, because the God of Easter is still at work.",
    ],
    prayers: [
      "Lord Jesus, thank You for rising from the dead. May the power of Your resurrection fill our lives.",
      "Father, let every dead area of our lives receive new life today.",
      "May the joy of Easter fill our homes, and may our families be blessed with love and peace.",
      "May every stone in our way be rolled away, and every closed door be opened.",
      "Risen Lord, make all things new for us, from our health to our hopes.",
      "May we walk in resurrection power and live with fearless faith.",
      "May the light of Easter morning chase away every darkness in our hearts.",
    ],
  },
  newYear: {
    name: "New Year",
    wish: "Happy New Year",
    reflections: [
      "A whole new year is before us, and we step into it by the mercy of God.",
      "We enter this year with gratitude for the one we have left, and faith for the one we are entering.",
      "Not everyone who started last year is here to begin this one. Our lives are a gift, and we do not take them lightly.",
      "A new year is a fresh page, and no one writes it better than God.",
      "We leave behind last year's tears, lessons and losses, and we carry forward its wisdom.",
      "Resolutions come and go, but prayers that begin the year with God tend to last.",
      "The best is not behind us. It is ahead, and we are walking into it today.",
    ],
    prayers: [
      "Lord, let this year be our year of favour, breakthrough and great testimonies.",
      "Father, we commit this whole year into Your hands. Lead us, keep us and bless us in every month.",
      "May every good door open to us this year, and may no evil door find its way into our lives.",
      "May this year bring us good health, wealth that does not weary us and peace that does not leave.",
      "Lord, let every delay of last year turn into double honour this year.",
      "May our homes be filled with joy, our work be crowned with success and our hearts be full of thanks all year long.",
      "May we end this year with songs of thanksgiving and testimonies that astonish us.",
    ],
  },
  christmasEve: {
    name: "Christmas Eve",
    wish: "Happy Christmas Eve",
    reflections: [
      "Tonight the whole world waits to celebrate the birth of the Saviour.",
      "Christmas is near, and with it the joy of family, food, music and the story of God coming close to us.",
      "Many of us are travelling home, packing gifts and preparing meals. May our hearts be as ready as our houses.",
      "The first Christmas happened in a humble place, and it reminds us that God is found in simple things.",
      "Tonight, we think of those who cannot be with their loved ones, and we hold them close in prayer.",
      "The joy of Christmas is not in what we receive, but in the gift we have already been given.",
      "As we prepare to celebrate, let us remember those who have less and share what we have.",
    ],
    prayers: [
      "Lord, bring every traveller home safely this Christmas.",
      "Father, let peace fill our homes tonight, and let love fill our tables tomorrow.",
      "May the joy of Christmas find everyone who is lonely, grieving or far from home.",
      "Lord, bless every family preparing to celebrate, and let no tragedy mar our joy.",
      "May the Prince of Peace reign in our hearts this Christmas.",
      "Father, make us generous, kind and thankful as we celebrate.",
      "May our celebrations be safe, joyful and full of love.",
    ],
  },
  christmas: {
    name: "Christmas",
    wish: "Merry Christmas",
    reflections: [
      "Unto us a Saviour is born. Today we celebrate the greatest gift ever given.",
      "Christmas is God saying: I am with you. In the noise, in the cooking, in the laughter, He is with us.",
      "May the warmth of this day remind us that we are loved beyond measure.",
      "The angels sang, the shepherds ran and the world has never been the same since.",
      "Today, around our tables and in our churches, we celebrate Emmanuel, God with us.",
      "Christmas is about love that came down, and love that now moves us to reach out.",
      "Whatever we have or do not have today, we have the greatest gift of all: a Saviour.",
    ],
    prayers: [
      "Lord, thank You for sending Jesus. May His peace and joy fill every home today.",
      "Father, bless every family gathered today, and be near to those who are alone.",
      "May the love of Christ overflow in our hearts and be shared with everyone we meet.",
      "Lord, let this Christmas be a season of joy, unity and new beginnings for us.",
      "May the blessings of the Christ child rest on our homes, our work and our health.",
      "Father, protect everyone who is travelling or celebrating today, and bring them safely home.",
      "May the peace of Christmas follow us into the new year and beyond.",
    ],
  },
  boxingDay: {
    name: "Boxing Day",
    wish: "Happy Boxing Day",
    reflections: [
      "The celebration continues. Today is for rest, family and the leftovers that taste even better.",
      "After the rush of Christmas, today invites us to slow down and enjoy the people around us.",
      "Boxing Day reminds us that giving is a joy, and sharing is a blessing.",
      "Even after the main celebration, the reasons for gladness remain.",
      "Today is a good day to rest, reflect and be grateful for the year that is closing.",
      "A quiet day after a busy one is a gift. Let us receive it.",
      "The year is nearly over, and we are still here. That is cause enough for joy.",
    ],
    prayers: [
      "Lord, let the joy of Christmas stay with us and our families through the days ahead.",
      "May every traveller reach home safely, and may our roads be free of accidents.",
      "Father, bless every home and every table, and let peace remain in our hearts.",
      "May the goodness of this season carry into the new year.",
      "Lord, rest our bodies, renew our minds and refresh our spirits today.",
      "May we be generous in the days ahead, and may our generosity be returned to us.",
      "Lord, let us end this year well, with gratitude and good health.",
    ],
  },
  yearEnd: {
    name: "Year end",
    wish: "Happy last day of the year",
    reflections: [
      "We have made it to the last day of the year. Many who began it with us are no longer here, and that humbles us.",
      "Today we look back, count our blessings and give thanks for every mercy.",
      "This year had its battles and its blessings. Both have shaped us, and God was present in both.",
      "Not every dream came true this year, but nothing we gave to God was wasted.",
      "As the year closes, let us forgive, let go and walk into the new year lighter.",
      "A final day is a good day for gratitude, and a good day for hope.",
      "Whatever the year took from us, God can restore. Whatever it gave us, we thank Him for.",
    ],
    prayers: [
      "Lord, thank You for carrying us through this year. Every mercy, every rescue and every miracle, we receive with thanks.",
      "Father, let every pain of this year end here, and let the new year bring healing.",
      "May we cross into the new year in peace, joy and safety.",
      "Lord, forgive us where we fell short, and renew us for the year ahead.",
      "May the new year find us stronger, wiser and more thankful than ever.",
      "Father, bless every home as this year closes, and let no sorrow follow us into the next.",
      "May the last hours of this year be filled with gratitude, and the first hours of the next with hope.",
    ],
  },
  independence: {
    name: "Independence Day",
    wish: "Happy Independence Day",
    reflections: [
      "Today we celebrate the birth of our nation, with its colour, its resilience and its people.",
      "Nigeria is a land of hardworking, hopeful and resilient people, and today we honour that spirit.",
      "Love for our country is shown in how we treat one another, work honestly and keep hope alive.",
      "Our nation has come a long way, and we still believe in a brighter tomorrow.",
      "No matter the challenges, we are a people who rise, smile and keep going.",
      "Let us do our small part, however small, to make our country better.",
      "Today we remember those who laboured so that we could be free, and we say thank you.",
    ],
    prayers: [
      "Lord, bless our nation. Bring peace to every region, unity among our people and justice in our land.",
      "Father, give wisdom to our leaders and compassion to all who serve.",
      "May our country prosper, our youth find opportunity and our streets be safe.",
      "Lord, heal our land, and let love and honesty guide our people.",
      "May the hardworking men and women of this country see the fruit of their labour.",
      "Father, let Nigeria rise to the greatness You have placed within her.",
      "May every home in this nation know peace, provision and hope.",
    ],
  },
  workersDay: {
    name: "Workers' Day",
    wish: "Happy Workers' Day",
    reflections: [
      "Today we honour everyone who works, from offices to farms, markets to roads, hospitals to classrooms.",
      "Honest work is dignity, and every worker deserves respect.",
      "Behind every service we enjoy is someone who woke up early and gave their best.",
      "Whether our work is seen or unseen, it matters, and so do we.",
      "Rest today if you can, and know that your effort has not gone unnoticed.",
      "Work is a calling, and today we remember that every honest labour is worthy of honour.",
      "May we not only work hard, but also work with joy and purpose.",
    ],
    prayers: [
      "Lord, bless the hands that work, and let every labour be rewarded fairly.",
      "May every worker be paid on time, treated with dignity and kept safe.",
      "Father, open doors of employment for those who are searching.",
      "May our work be a blessing to others and a source of joy to us.",
      "Lord, give rest to the weary and strength to those still on duty today.",
      "May every business and workplace be filled with honesty, peace and growth.",
      "Father, bless the workers of this nation, and let their efforts bring lasting prosperity.",
    ],
  },
  democracy: {
    name: "Democracy Day",
    wish: "Happy Democracy Day",
    reflections: [
      "Today we reflect on the value of every voice, every vote and every citizen.",
      "A healthy nation is built on fairness, participation and hope.",
      "Democracy is a gift that grows when we care for it with honesty and patience.",
      "Our country needs people who pray, people who serve and people who speak the truth with love.",
      "However we see things, we all want a land of peace, fairness and opportunity.",
      "Let us honour this day by being good neighbours and responsible citizens.",
      "Hope for our nation begins with the way we live each day.",
    ],
    prayers: [
      "Lord, bless our nation with peace, justice and good leadership.",
      "Father, let truth, fairness and kindness govern our land.",
      "May every citizen be heard, respected and protected.",
      "Lord, give our leaders wisdom, courage and a listening heart.",
      "May unity replace division, and may love overcome fear.",
      "Father, let every family in this nation see better days.",
      "May our country be a place of safety, opportunity and joy for all.",
    ],
  },
};

// Date lookups for the special days. Months are zero-based.
const FIXED_SPECIALS = {
  '0-1': 'newYear',
  '11-24': 'christmasEve',
  '11-25': 'christmas',
  '11-26': 'boxingDay',
  '11-31': 'yearEnd',
  '9-1': 'independence',
  '4-1': 'workersDay',
  '5-12': 'democracy',
};

/** Easter Sunday for a year (Anonymous Gregorian algorithm). */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The key of the special day on this date, or null. */
function specialKey(date) {
  const fixed = FIXED_SPECIALS[`${date.getMonth()}-${date.getDate()}`];
  if (fixed) return fixed;
  const easter = easterSunday(date.getFullYear());
  if (sameDay(date, easter)) return 'easter';
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
  if (sameDay(date, goodFriday)) return 'goodFriday';
  return null;
}

/** Joins two themes into one, using the first one's greeting. */
function mergeThemes(primary, secondary) {
  return {
    wish: primary.wish,
    reflections: primary.reflections.concat(secondary.reflections),
    prayers: primary.prayers.concat(secondary.prayers),
  };
}

/** The theme that applies on a date, with its short name. */
function themeFor(date) {
  const key = specialKey(date);
  const isFirst = date.getDate() === 1;
  if (key) {
    const special = SPECIALS[key];
    return {
      name: special.name,
      general: false,
      ...(isFirst ? mergeThemes(special, NEW_MONTH_THEME) : special),
      wish: special.wish,
    };
  }
  if (isFirst) return { name: NEW_MONTH_NAME_VALUE, general: false, ...NEW_MONTH_THEME };
  return { name: THEME_NAMES_VALUE[date.getDay()], general: true, ...THEMES[date.getDay()] };
}

// ---------------------------------------------------------------- Helpers
// A small, dependency-free string hash (cyrb53) so each pick is
// deterministic per contact+day+slot (stable if you reload the page) but
// varies across contacts, across days and across the message slots, without
// needing to store anything extra.
function hashString(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function pick(list, seed) {
  return list[hashString(seed) % list.length];
}

/** True about `percent` times in 100, steadily for the same seed. */
function chance(percent, seed) {
  return hashString(seed) % 100 < percent;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function timeOfDay(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// Which pieces each shape uses, in order.
const SHAPES = [
  'full', 'full', 'full',
  'short', 'short',
  'lead', 'lead',
  'double', 'double',
  'brief',
];

function buildPrayer(seed) {
  const frame = pick(PRAYER_FRAMES, `${seed}|frame`);
  return frame
    .replace('{inv}', pick(INVOCATIONS, `${seed}|inv`))
    .replace('{req}', pick(PRAYER_REQUESTS, `${seed}|req`))
    .replace('{tail}', pick(PRAYER_TAILS, `${seed}|tail`));
}

export function greetingFor(contact, viewDate, now = new Date()) {
  const theme = themeFor(viewDate);
  const tod = timeOfDay(now);
  const seed = `${contact.phone}|${fmtDateKey(viewDate)}`;

  const reflections = theme.general ? theme.reflections.concat(GENERAL_REFLECTIONS) : theme.reflections;
  const useBuiltPrayer = theme.general && chance(40, `${seed}|usebuilt`);

  const iconRaw = pick(OPENER_ICONS[tod], `${seed}|icon`);
  const opener = `${iconRaw ? `${iconRaw} ` : ''}${pick(OPENERS, `${seed}|opener`)}`;
  const checkin = pick(CHECKINS[tod], `${seed}|checkin`);
  const season = chance(30, `${seed}|useseason`)
    ? pick(SEASON_LINES[SEASON_BY_MONTH[viewDate.getMonth()]], `${seed}|season`)
    : '';
  const reflection = pick(reflections, `${seed}|reflection`);
  const prayer = useBuiltPrayer ? buildPrayer(`${seed}|built`) : pick(theme.prayers, `${seed}|prayer`);
  const timePrayer = pick(TIME_PRAYERS[tod], `${seed}|time`);
  const bridge = pick(BRIDGES, `${seed}|bridge`);
  const amen = pick(AMENS, `${seed}|amen`);
  const wellWish = pick(WELL_WISHES[tod], `${seed}|wish`);

  let closer = pick(CLOSERS, `${seed}|closer`);
  if (chance(20, `${seed}|doubleclose`)) {
    const second = pick(CLOSERS, `${seed}|closer2`);
    if (second !== closer) closer = `${closer}${second}`;
  }

  const closing = `${amen} ${wellWish} ${closer}`;
  const shape = pick(SHAPES, `${seed}|shape`);

  let parts;
  if (shape === 'short') {
    parts = [`*${opener}*`, season, prayer, closing];
  } else if (shape === 'lead') {
    parts = [`*${opener}* ${checkin}`, season, reflection, [bridge, prayer].filter(Boolean).join(' '), closing];
  } else if (shape === 'double') {
    parts = [`*${opener}*`, season, prayer, timePrayer, closing];
  } else if (shape === 'brief') {
    parts = [`*${opener}*`, timePrayer, closing];
  } else {
    parts = [`*${opener}*`, season, reflection, `${prayer} ${timePrayer}`, closing];
  }

  const month = MONTH_NAMES[viewDate.getMonth()];
  return parts
    .filter(Boolean)
    .join('\n\n')
    .replace(/{tod}/g, tod)
    .replace(/{wish}/g, theme.wish)
    .replace(/{month}/g, month);
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
const THEME_NAMES_VALUE = THEME_NAMES;
const NEW_MONTH_NAME_VALUE = NEW_MONTH_NAME;

/** Name of the theme that applies on the given date. */
export function themeNameFor(date) {
  return themeFor(date).name;
}

/** Builds the WhatsApp click-to-chat link for a number and message. */
export function waLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
