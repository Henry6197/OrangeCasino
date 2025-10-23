// Todd's Dialogue Lines for Orange Casino
// You can customize Todd's responses by editing the messages in this file

const TODD_DIALOGUE = {
  // General messages
  loan: {
    granted: "Take out another one bro",
    noDebt: "You have no debt, clearly you haven't been gambling enough",
    insufficientFunds: "Not enough balance to pay your debt, clearly it's time to go gambling",
    thanksPaid: "Thanks for paying your debt!",
    autoPaidOff: "Yo! I auto-paid your debt since you're ballin' now! Keep it up!"
  },

  // Slot machine messages
  slots: {
    loss: "99 percent of gamblers quit before winning big",
    win: "LET'S GOOOO",
    insufficientFunds: "Time to take out a loan before continuing to gamble"
  },

  // Blackjack messages
  blackjack: {
    insufficientFunds: "Time to take out a loan before continuing to gamble",
    playerBust: "Oh My God Bruh",
    dealerBust: "The dealer should clearly start standing at 0",
    playerBlackjack: "Congratulations on the blackjack!",
    dealerBlackjack: "Shame, the dealer got blackjack",
    tie: "It's a tie! Your bet is returned.",
    playerWin: "Nice win!",
    dealerWin: "Double down for real this time"
  },

  // Poker messages
  poker: {
    insufficientFunds: "Time to take out a loan before continuing to gamble",
    win: "Great hand! You got them!",
    loss: "Tough break, try again!",
    tie: "Split pot, close game!",
    fold: "You totally had that one"
  },

  // Surgery and medical procedures
  medical: {
    surgeryWait: "Wait until surgery finishes.",
    surgeryComplete: "You made $30,000. Now back to gambling!",
    appendixWait: "Wait until the procedure finishes.",
    appendixComplete: "You made $3. I suppose it's better than nothing.",
    cannotLeave: "You cannot leave during the procedure."
  },

  // Achievement messages
  achievements: {
    unlocked: "Achievement unlocked: {title}" // {title} will be replaced with actual achievement name
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.TODD_DIALOGUE = TODD_DIALOGUE;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = TODD_DIALOGUE;
}