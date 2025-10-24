// Donny Boy's Rambling Dialogue System for Orange Casino
// He talks constantly with random nonsense and lots of filler words

// Filler words and sounds Donny Boy uses
const FILLERS = [
  "uhh", "uhhm", "err", "ummm", "ahh", "well", "you know", "like", 
  "so anyway", "by the way", "listen", "believe me", "let me tell you",
  "tremendous", "incredible", "amazing", "fantastic", "huge", "bigly",
  "many people say", "everybody knows", "nobody talks about this but"
];

// Random nonsense topics
const NONSENSE_TOPICS = [
  "the fake news media",
  "my tremendous casinos",
  "these beautiful slot machines",
  "the best dealers, really the best",
  "China and their gambling",
  "my uncle who was very smart",
  "the rigged system",
  "winning so much you'll get tired of winning",
  "the deep state blackjack dealers",
  "my massive hands for dealing cards",
  "the corrupt poker establishment",
  "my genius business deals",
  "the tremendous crowds at my casinos",
  "my beautiful, perfect games",
  "the dishonest gaming commission"
];

// Random sentence fragments
const SENTENCE_FRAGMENTS = [
  "is totally rigged, believe me",
  "nobody's ever seen anything like it",
  "it's incredible, really incredible",
  "they don't want you to know this",
  "I've been saying this for years",
  "makes no sense, no sense at all",
  "is probably the best in history",
  "the likes of which we've never seen",
  "would make your head spin",
  "is fake news, total fake news",
  "everybody's talking about it",
  "is a complete disaster",
  "has never been better, never",
  "is tremendous, really tremendous"
];

// Function to generate random rambling dialogue
function generateRandomRamble() {
  const filler1 = FILLERS[Math.floor(Math.random() * FILLERS.length)];
  const filler2 = FILLERS[Math.floor(Math.random() * FILLERS.length)];
  const topic = NONSENSE_TOPICS[Math.floor(Math.random() * NONSENSE_TOPICS.length)];
  const fragment = SENTENCE_FRAGMENTS[Math.floor(Math.random() * SENTENCE_FRAGMENTS.length)];
  
  const templates = [
    `${filler1.charAt(0).toUpperCase() + filler1.slice(1)}, ${topic} ${fragment}, ${filler2}.`,
    `${filler1.charAt(0).toUpperCase() + filler1.slice(1)}, I was just thinking about ${topic} and how it ${fragment}.`,
    `You know what? ${topic} ${fragment}, ${filler2}, it's true!`,
    `${filler1.charAt(0).toUpperCase() + filler1.slice(1)}, ${filler2}, ${topic} ${fragment}.`,
    `So I was talking to someone - very important person - about ${topic} and ${filler2}, it ${fragment}.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Donny Boy's constant rambling system
const DONNY_RAMBLE = {
  // Generate dialogue for any situation
  getRamble: () => generateRandomRamble(),
  
  // Backup system - keeps the old structure but replaces with rambling
  loan: {
    granted: () => generateRandomRamble(),
    noDebt: () => generateRandomRamble(),
    insufficientFunds: () => generateRandomRamble(),
    thanksPaid: () => generateRandomRamble(),
    autoPaidOff: () => generateRandomRamble()
  },
  
  slots: {
    loss: () => generateRandomRamble(),
    win: () => generateRandomRamble(),
    insufficientFunds: () => generateRandomRamble()
  },
  
  blackjack: {
    insufficientFunds: () => generateRandomRamble(),
    playerBust: () => generateRandomRamble(),
    dealerBust: () => generateRandomRamble(),
    playerBlackjack: () => generateRandomRamble(),
    dealerBlackjack: () => generateRandomRamble(),
    tie: () => generateRandomRamble(),
    playerWin: () => generateRandomRamble(),
    dealerWin: () => generateRandomRamble()
  },
  
  poker: {
    insufficientFunds: () => generateRandomRamble(),
    win: () => generateRandomRamble(),
    loss: () => generateRandomRamble(),
    tie: () => generateRandomRamble(),
    fold: () => generateRandomRamble()
  },
  
  medical: {
    surgeryWait: () => generateRandomRamble(),
    surgeryComplete: () => generateRandomRamble(),
    appendixWait: () => generateRandomRamble(),
    appendixComplete: () => generateRandomRamble(),
    cannotLeave: () => generateRandomRamble()
  },
  
  achievements: {
    unlocked: () => generateRandomRamble()
  }
};

// For backwards compatibility, create TODD_DIALOGUE that returns rambling
const TODD_DIALOGUE = {};
Object.keys(DONNY_RAMBLE).forEach(category => {
  if (typeof DONNY_RAMBLE[category] === 'object' && DONNY_RAMBLE[category] !== null) {
    TODD_DIALOGUE[category] = {};
    Object.keys(DONNY_RAMBLE[category]).forEach(key => {
      if (typeof DONNY_RAMBLE[category][key] === 'function') {
        TODD_DIALOGUE[category][key] = DONNY_RAMBLE[category][key]();
      }
    });
  }
});

// Auto-rambling system - Donny Boy talks every few seconds
let rambleInterval;

function startConstantRambling() {
  if (rambleInterval) clearInterval(rambleInterval);
  
  rambleInterval = setInterval(() => {
    if (window.vc && typeof window.vc.setBuddyText === 'function') {
      window.vc.setBuddyText(generateRandomRamble());
    }
  }, 8000 + Math.random() * 7000); // Random interval between 8-15 seconds
}

// Start rambling when the page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(startConstantRambling, 2000); // Start after 2 seconds
  });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.TODD_DIALOGUE = TODD_DIALOGUE;
  window.DONNY_RAMBLE = DONNY_RAMBLE;
  window.generateRandomRamble = generateRandomRamble;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TODD_DIALOGUE, DONNY_RAMBLE, generateRandomRamble };
}