document.addEventListener('DOMContentLoaded', ()=>{
  // Texas Hold'em Poker Implementation
  const dealBtn = document.getElementById('deal-btn');
  const foldBtn = document.getElementById('fold-btn');
  const callBtn = document.getElementById('call-btn');
  const raiseBtn = document.getElementById('raise-btn');
  const checkBtn = document.getElementById('check-btn');
  const betBtn = document.getElementById('bet-btn');
  
  const log = document.getElementById('poker-log');
  const dealerEl = document.getElementById('dealer-hand');
  const playerEl = document.getElementById('player-hand');
  const communityEl = document.getElementById('community-cards');
  const betInput = document.getElementById('poker-bet');
  const raiseAmountInput = document.getElementById('raise-amount');
  const gameStatusEl = document.getElementById('game-status');
  const potAmountEl = document.getElementById('pot-amount');
  const dealerChipsEl = document.getElementById('dealer-chips');
  const currentBetEl = document.getElementById('current-bet');

  // Player behavior tracking for bluff detection
  let playerStats = {
    totalHands: 0,
    preflopRaises: 0,
    preflopFolds: 0,
    flopBets: 0,
    flopFolds: 0,
    turnBets: 0,
    turnFolds: 0,
    riverBets: 0,
    showdownHands: [],
    bigBluffs: 0, // Tracked when player shows weak hand after aggressive betting
    valueBets: 0, // Tracked when player shows strong hand after aggressive betting
    recentActions: [] // Last 10 hands history
  };

  // Game state
  let gameState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    dealerChips: 1000,
    phase: 'waiting', // waiting, preflop, flop, turn, river, showdown
    dealerBet: 0,
    playerBet: 0,
    gameActive: false,
    playerRaisedPreflop: false,
    playerRaisedFlop: false,
    playerRaisedTurn: false,
    playerRaisedRiver: false,
    playerBetSizes: [] // Track bet sizes this hand
  };

  // Card utilities
  function makeDeck(){ 
    const suits=['♠','♥','♦','♣']; 
    const ranks=['2','3','4','5','6','7','8','9','10','J','Q','K','A']; 
    const d=[]; 
    suits.forEach(s=>ranks.forEach(r=>d.push({suit:s,rank:r}))); 
    return d; 
  }
  
  function shuffle(d){ 
    for(let i=d.length-1;i>0;i--){ 
      const j=Math.floor(Math.random()*(i+1)); 
      [d[i],d[j]]=[d[j],d[i]];
    } 
  }
  
  function cardToStr(c){ return `${c.rank}${c.suit}` }
  
  // Create a proper playing card element with suit and rank
  function createCardElement(card, hideCard = false, animationDelay = 0) {
    const cardEl = document.createElement('div');
    cardEl.className = 'playing-card poker-card';
    cardEl.style.animationDelay = `${animationDelay}s`;
    
    if (hideCard) {
      cardEl.classList.add('face-down');
      cardEl.innerHTML = `
        <div class="card-back">
          <div class="card-back-pattern"></div>
        </div>
      `;
    } else {
      const isRed = ['♥', '♦'].includes(card.suit);
      cardEl.classList.add(isRed ? 'red' : 'black');
      
      const rankDisplay = card.rank;
      const suitDisplay = card.suit;
      
      cardEl.innerHTML = `
        <div class="card-front">
          <div class="card-corner top-left">
            <div class="rank">${rankDisplay}</div>
            <div class="suit">${suitDisplay}</div>
          </div>
          <div class="card-center">
            <div class="suit-large">${suitDisplay}</div>
          </div>
          <div class="card-corner bottom-right">
            <div class="rank">${rankDisplay}</div>
            <div class="suit">${suitDisplay}</div>
          </div>
        </div>
      `;
    }
    
    return cardEl;
  }
  
  function appendLog(s){ 
    if(!log) return; 
    const p=document.createElement('div'); 
    p.textContent=s; 
    log.prepend(p); 
  }

  // Hand evaluation (Texas Hold'em - best 5 cards from 7)
  function rankValue(r){ 
    if(r==='A') return 14; 
    if(r==='K') return 13; 
    if(r==='Q') return 12; 
    if(r==='J') return 11; 
    return Number(r); 
  }

  function evaluateHand(cards) {
    if(cards.length < 5) return {rank: 0, name: 'No Hand', kickers: []};
    
    // Get all possible 5-card combinations
    const combinations = [];
    for(let i = 0; i < cards.length - 4; i++) {
      for(let j = i + 1; j < cards.length - 3; j++) {
        for(let k = j + 1; k < cards.length - 2; k++) {
          for(let l = k + 1; l < cards.length - 1; l++) {
            for(let m = l + 1; m < cards.length; m++) {
              combinations.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
            }
          }
        }
      }
    }
    
    let bestHand = {rank: 0, name: 'High Card', kickers: []};
    
    combinations.forEach(hand => {
      const result = evaluateFiveCards(hand);
      if(result.rank > bestHand.rank || 
         (result.rank === bestHand.rank && compareKickers(result.kickers, bestHand.kickers) > 0)) {
        bestHand = result;
      }
    });
    
    return bestHand;
  }

  function evaluateFiveCards(cards) {
    const ranks = cards.map(c => rankValue(c.rank)).sort((a,b) => b-a);
    const suits = cards.map(c => c.suit);
    const rankCounts = {};
    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a,b) => b-a);
    
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
    const isLowStraight = ranks.join('') === '14,5,4,3,2'; // A,5,4,3,2
    
    if(isFlush && isStraight && ranks[0] === 14) return {rank: 9, name: 'Royal Flush', kickers: ranks};
    if(isFlush && (isStraight || isLowStraight)) return {rank: 8, name: 'Straight Flush', kickers: isLowStraight ? [5,4,3,2,1] : ranks};
    if(counts[0] === 4) return {rank: 7, name: 'Four of a Kind', kickers: ranks};
    if(counts[0] === 3 && counts[1] === 2) return {rank: 6, name: 'Full House', kickers: ranks};
    if(isFlush) return {rank: 5, name: 'Flush', kickers: ranks};
    if(isStraight || isLowStraight) return {rank: 4, name: 'Straight', kickers: isLowStraight ? [5,4,3,2,1] : ranks};
    if(counts[0] === 3) return {rank: 3, name: 'Three of a Kind', kickers: ranks};
    if(counts[0] === 2 && counts[1] === 2) return {rank: 2, name: 'Two Pair', kickers: ranks};
    if(counts[0] === 2) return {rank: 1, name: 'One Pair', kickers: ranks};
    return {rank: 0, name: 'High Card', kickers: ranks};
  }

  function compareKickers(a, b) {
    for(let i = 0; i < Math.min(a.length, b.length); i++) {
      if(a[i] > b[i]) return 1;
      if(a[i] < b[i]) return -1;
    }
    return 0;
  }

  // UI Updates
  function updateUI() {
    potAmountEl.textContent = gameState.pot;
    dealerChipsEl.textContent = gameState.dealerChips;
    currentBetEl.textContent = gameState.playerBet;
    
    // Update community cards
    communityEl.innerHTML = '';
    gameState.communityCards.forEach((card, i) => {
      const cardEl = createCardElement(card, false, i * 0.15);
      communityEl.appendChild(cardEl);
    });
    
    // Update player hand with hand strength display
    playerEl.innerHTML = '';
    gameState.playerHand.forEach((card, i) => {
      const cardEl = createCardElement(card, false, i * 0.1);
      playerEl.appendChild(cardEl);
    });
    
    // Show current hand strength for player if community cards exist
    if(gameState.communityCards.length > 0 && gameState.playerHand.length > 0) {
      const playerCards = [...gameState.playerHand, ...gameState.communityCards];
      const playerHand = evaluateHand(playerCards);
      const handStrengthEl = document.createElement('div');
      handStrengthEl.className = 'hand-strength-indicator';
      handStrengthEl.textContent = `${playerHand.name}`;
      playerEl.appendChild(handStrengthEl);
    }
    
    // Update dealer hand
    dealerEl.innerHTML = '';
    gameState.dealerHand.forEach((card, i) => {
      const hideCard = gameState.phase !== 'showdown';
      const cardEl = createCardElement(card, hideCard, i * 0.1);
      dealerEl.appendChild(cardEl);
    });
    
    // Show dealer hand strength in showdown
    if(gameState.phase === 'showdown' && gameState.dealerHand.length > 0) {
      const dealerCards = [...gameState.dealerHand, ...gameState.communityCards];
      const dealerHand = evaluateHand(dealerCards);
      const handStrengthEl = document.createElement('div');
      handStrengthEl.className = 'hand-strength-indicator';
      handStrengthEl.textContent = `${dealerHand.name}`;
      dealerEl.appendChild(handStrengthEl);
    }
  }

  function updateButtons() {
    const canAct = gameState.gameActive && gameState.phase !== 'showdown';
    foldBtn.disabled = !canAct;
    
    // If dealer has bet more than player, show call button
    if(gameState.dealerBet > gameState.playerBet) {
      callBtn.disabled = !canAct;
      callBtn.textContent = `Call $${gameState.dealerBet - gameState.playerBet}`;
      checkBtn.disabled = true;
      betBtn.disabled = true;
    } else if(gameState.dealerBet === 0 && gameState.playerBet === 0) {
      // No one has bet yet - player can check or bet
      callBtn.disabled = true;
      checkBtn.disabled = !canAct;
      betBtn.disabled = !canAct;
    } else {
      // Bets are equal - player can check or raise
      callBtn.disabled = true;
      checkBtn.disabled = !canAct;
      betBtn.disabled = true;
    }
    
    raiseBtn.disabled = !canAct;
  }

  // Game phases
  function startNewHand() {
    const ante = Number(betInput.value || 10);
    let balance = vc.readBalance();
    
    if(ante <= 0) {
      appendLog('Invalid bet amount.');
      return;
    }
    
    if(ante > balance) {
      appendLog('Insufficient funds for that bet.');
      vc.setBuddyText('Not enough funds — lower the bet or get more chips.');
      return;
    }
    
    // Reset game state
    gameState = {
      deck: makeDeck(),
      playerHand: [],
      dealerHand: [],
      communityCards: [],
      pot: ante * 2, // Both players put in ante
      currentBet: ante,
      dealerChips: gameState.dealerChips - ante,
      phase: 'preflop',
      dealerBet: ante,
      playerBet: ante,
      gameActive: true,
      playerRaisedPreflop: false,
      playerRaisedFlop: false,
      playerRaisedTurn: false,
      playerRaisedRiver: false,
      playerBetSizes: []
    };
    
    // Track stats
    playerStats.totalHands++;
    
    // Track poker play for achievements
    try{ if(window.vc && typeof window.vc.incrementPokerPlays === 'function') window.vc.incrementPokerPlays(1); }catch(e){}
    
    shuffle(gameState.deck);
    balance -= ante;
    vc.writeBalance(balance);
    
    // Deal hole cards
    gameState.playerHand.push(gameState.deck.pop(), gameState.deck.pop());
    gameState.dealerHand.push(gameState.deck.pop(), gameState.deck.pop());
    
    gameStatusEl.textContent = "Pre-flop: Make your decision";
    appendLog(`New hand started. Ante: $${ante}`);
    
    updateUI();
    updateButtons();
  }

  function dealFlop() {
    if(gameState.phase !== 'preflop') return;
    
    // Burn card and deal flop
    gameState.deck.pop(); // burn
    gameState.communityCards.push(
      gameState.deck.pop(),
      gameState.deck.pop(),
      gameState.deck.pop()
    );
    
    gameState.phase = 'flop';
    gameState.dealerBet = 0; // Reset betting for new round
    gameState.playerBet = 0;
    gameStatusEl.textContent = "Flop: Make your move";
    appendLog("Flop dealt - betting round begins");
    
    updateUI();
    updateButtons();
    
    // Player gets to act first in flop
  }

  function dealTurn() {
    if(gameState.phase !== 'flop') return;
    
    gameState.deck.pop(); // burn
    gameState.communityCards.push(gameState.deck.pop());
    
    gameState.phase = 'turn';
    gameState.dealerBet = 0; // Reset betting for new round
    gameState.playerBet = 0;
    gameStatusEl.textContent = "Turn: Make your move";
    appendLog("Turn card dealt - betting round begins");
    
    updateUI();
    updateButtons();
    
    // Player gets to act first in turn
  }

  function dealRiver() {
    if(gameState.phase !== 'turn') return;
    
    gameState.deck.pop(); // burn
    gameState.communityCards.push(gameState.deck.pop());
    
    gameState.phase = 'river';
    gameState.dealerBet = 0; // Reset betting for new round
    gameState.playerBet = 0;
    gameStatusEl.textContent = "River: Make your final move";
    appendLog("River card dealt - final betting round begins");
    
    updateUI();
    updateButtons();
    
    // Player gets to act first in river
  }

  function showdown() {
    gameState.phase = 'showdown';
    gameState.gameActive = false;
    
    const playerCards = [...gameState.playerHand, ...gameState.communityCards];
    const dealerCards = [...gameState.dealerHand, ...gameState.communityCards];
    
    const playerHand = evaluateHand(playerCards);
    const dealerHand = evaluateHand(dealerCards);
    
    updateUI();
    updateButtons();
    
    let winner = '';
    let balance = vc.readBalance();
    
    // Update player stats based on showdown result
    const wasAggressive = gameState.playerRaisedPreflop || gameState.playerRaisedFlop || 
                         gameState.playerRaisedTurn || gameState.playerRaisedRiver;
    
    if(playerHand.rank > dealerHand.rank || 
       (playerHand.rank === dealerHand.rank && compareKickers(playerHand.kickers, dealerHand.kickers) > 0)) {
      winner = 'player';
      balance += gameState.pot;
      vc.writeBalance(balance);
      appendLog(`You win $${gameState.pot}! ${playerHand.name} vs ${dealerHand.name}`);
      vc.confetti(40);
      vc.showBigMessage(`You won $${gameState.pot}!`, 1400);
      vc.setBuddyText('Great hand! You got them!');
      
      // Track if player bet aggressively with strong hand (value betting)
      if(wasAggressive && playerHand.rank >= 3) {
        playerStats.valueBets++;
      }
    } else if(dealerHand.rank > playerHand.rank ||
              (playerHand.rank === dealerHand.rank && compareKickers(dealerHand.kickers, playerHand.kickers) > 0)) {
      winner = 'dealer';
      gameState.dealerChips += gameState.pot;
      appendLog(`Dealer wins with ${dealerHand.name} vs your ${playerHand.name}`);
      vc.showBigMessage('YOU LOST', 1000);
      vc.setBuddyText('Tough break — try again!');
      
      // Track if player bet aggressively with weak hand (bluffing)
      if(wasAggressive && playerHand.rank <= 1) {
        playerStats.bigBluffs++;
      }
    } else {
      // Tie
      const split = gameState.pot / 2;
      balance += split;
      gameState.dealerChips += split;
      vc.writeBalance(balance);
      appendLog(`Split pot! Both had ${playerHand.name}`);
      vc.setBuddyText('Split pot — close game!');
    }
    
    // Store this hand in recent history
    playerStats.showdownHands.push({
      rank: playerHand.rank,
      wasAggressive: wasAggressive,
      won: winner === 'player'
    });
    if(playerStats.showdownHands.length > 10) {
      playerStats.showdownHands.shift();
    }
    
    gameStatusEl.textContent = "Hand complete. Deal new hand to continue.";
    updateUI();
  }

  // Player actions
  function fold() {
    if(!gameState.gameActive) return;
    
    gameState.dealerChips += gameState.pot;
    gameState.gameActive = false;
    
    appendLog("You folded. Dealer wins the pot.");
    gameStatusEl.textContent = "You folded. Deal new hand to continue.";
    vc.setBuddyText("Sometimes folding is the smart play.");
    
    updateUI();
    updateButtons();
  }

  function call() {
    if(!gameState.gameActive) return;
    
    const callAmount = gameState.dealerBet - gameState.playerBet;
    let balance = vc.readBalance();
    
    if(callAmount > balance) {
      appendLog('Insufficient funds to call.');
      return;
    }
    
    balance -= callAmount;
    vc.writeBalance(balance);
    gameState.playerBet += callAmount;
    gameState.pot += callAmount;
    
    appendLog(`You called $${callAmount}`);
    
    // Move to next phase since calling means bets are now equal
    nextPhase();
  }

  function check() {
    if(!gameState.gameActive) return;
    
    appendLog("You checked");
    
    // Trigger dealer action after player checks
    setTimeout(dealerAction, 1000);
  }

  function bet() {
    if(!gameState.gameActive) return;
    
    const betAmount = Number(betInput.value || 10);
    let balance = vc.readBalance();
    
    if(betAmount <= 0) {
      appendLog('Invalid bet amount.');
      return;
    }
    
    if(betAmount > balance) {
      appendLog('Insufficient funds for that bet.');
      return;
    }
    
    balance -= betAmount;
    vc.writeBalance(balance);
    gameState.playerBet = betAmount;
    gameState.pot += betAmount;
    gameState.playerBetSizes.push(betAmount);
    
    // Track betting by phase
    if(gameState.phase === 'flop') {
      playerStats.flopBets++;
      gameState.playerRaisedFlop = true;
    } else if(gameState.phase === 'turn') {
      playerStats.turnBets++;
      gameState.playerRaisedTurn = true;
    } else if(gameState.phase === 'river') {
      playerStats.riverBets++;
      gameState.playerRaisedRiver = true;
    }
    
    appendLog(`You bet $${betAmount}`);
    
    // Trigger dealer action after player bets
    setTimeout(dealerAction, 1000);
  }

  function raise() {
    if(!gameState.gameActive) return;
    
    const raiseAmount = Number(raiseAmountInput.value || 20);
    const totalBet = Math.max(raiseAmount, gameState.dealerBet + 10); // Min raise of 10
    const additionalBet = totalBet - gameState.playerBet;
    
    let balance = vc.readBalance();
    
    if(additionalBet > balance) {
      appendLog('Insufficient funds to raise.');
      return;
    }
    
    balance -= additionalBet;
    vc.writeBalance(balance);
    gameState.playerBet = totalBet;
    gameState.pot += additionalBet;
    gameState.playerBetSizes.push(totalBet);
    
    // Track raising by phase
    if(gameState.phase === 'preflop') {
      playerStats.preflopRaises++;
      gameState.playerRaisedPreflop = true;
    } else if(gameState.phase === 'flop') {
      playerStats.flopBets++;
      gameState.playerRaisedFlop = true;
    } else if(gameState.phase === 'turn') {
      playerStats.turnBets++;
      gameState.playerRaisedTurn = true;
    } else if(gameState.phase === 'river') {
      playerStats.riverBets++;
      gameState.playerRaisedRiver = true;
    }
    
    appendLog(`You raised to $${totalBet}`);
    
    // Dealer responds to raise
    setTimeout(() => dealerRespondToRaise(totalBet), 1000);
  }

  function nextPhase() {
    updateUI();
    updateButtons();
    
    // Check if betting round is complete (both players have acted and bets are equal)
    if(gameState.dealerBet !== gameState.playerBet) {
      // Betting not complete, wait for more action
      return;
    }
    
    if(gameState.phase === 'preflop') {
      setTimeout(() => dealFlop(), 1000);
    } else if(gameState.phase === 'flop') {
      setTimeout(() => dealTurn(), 1000);
    } else if(gameState.phase === 'turn') {
      setTimeout(() => dealRiver(), 1000);
    } else if(gameState.phase === 'river') {
      setTimeout(() => showdown(), 1000);
    }
  }

  // Advanced poker AI with equity calculation and strategic play
  
  // Calculate hand equity using Monte Carlo simulation
  function calculateEquity(holeCards, communityCards, numSimulations = 1000) {
    let wins = 0;
    let ties = 0;
    
    for(let sim = 0; sim < numSimulations; sim++) {
      // Create a deck without known cards
      const knownCards = [...holeCards, ...communityCards];
      const simulationDeck = makeDeck().filter(card => 
        !knownCards.some(known => known.rank === card.rank && known.suit === card.suit)
      );
      shuffle(simulationDeck);
      
      // Deal opponent two random cards
      const oppCards = [simulationDeck.pop(), simulationDeck.pop()];
      
      // Complete community cards if needed
      const simCommunity = [...communityCards];
      while(simCommunity.length < 5) {
        simCommunity.push(simulationDeck.pop());
      }
      
      // Evaluate both hands
      const ourHand = evaluateHand([...holeCards, ...simCommunity]);
      const oppHand = evaluateHand([...oppCards, ...simCommunity]);
      
      if(ourHand.rank > oppHand.rank || 
         (ourHand.rank === oppHand.rank && compareKickers(ourHand.kickers, oppHand.kickers) > 0)) {
        wins++;
      } else if(ourHand.rank === oppHand.rank && compareKickers(ourHand.kickers, oppHand.kickers) === 0) {
        ties++;
      }
    }
    
    return (wins + ties * 0.5) / numSimulations;
  }
  
  // Calculate preflop hand strength based on Chen formula
  function getPreflopStrength(card1, card2) {
    const rank1 = rankValue(card1.rank);
    const rank2 = rankValue(card2.rank);
    const highCard = Math.max(rank1, rank2);
    const lowCard = Math.min(rank1, rank2);
    const suited = card1.suit === card2.suit;
    const paired = rank1 === rank2;
    const gap = highCard - lowCard - 1;
    
    let score = 0;
    
    // Base score from high card
    if(highCard === 14) score = 10; // Ace
    else if(highCard === 13) score = 8; // King
    else if(highCard === 12) score = 7; // Queen
    else if(highCard === 11) score = 6; // Jack
    else score = highCard / 2;
    
    // Pair bonus
    if(paired) {
      score *= 2;
      if(score < 5) score = 5;
    }
    
    // Suited bonus
    if(suited) score += 2;
    
    // Close cards bonus
    if(!paired) {
      if(gap === 0) score += 1; // Connected
      else if(gap === 1) score += 0; // 1 gap
      else if(gap === 2) score -= 1; // 2 gap
      else if(gap === 3) score -= 2; // 3 gap
      else score -= 4; // 4+ gap
      
      // Straight potential with low cards
      if(gap <= 1 && highCard < 12) score -= 1;
    }
    
    return Math.max(score, 0) / 20; // Normalize to 0-1
  }
  
  // Calculate pot odds
  function getPotOdds(callAmount, potSize) {
    return callAmount / (potSize + callAmount);
  }
  
  // Analyze player tendencies to detect bluffing
  function getBluffLikelihood() {
    if(playerStats.totalHands < 5) return 0.5; // Not enough data, assume neutral
    
    const bluffRate = playerStats.bigBluffs / Math.max(playerStats.showdownHands.length, 1);
    const valueRate = playerStats.valueBets / Math.max(playerStats.showdownHands.length, 1);
    
    // High bluff rate = player bluffs often
    // Low value rate = player doesn't have it when betting
    const bluffTendency = bluffRate * 2 + (1 - valueRate);
    
    // Recent aggression without strong hands indicates possible bluffing
    const recentWeak = playerStats.showdownHands.slice(-5).filter(h => 
      h.wasAggressive && h.rank <= 1
    ).length;
    
    return Math.min(bluffTendency / 3 + recentWeak * 0.1, 0.9);
  }
  
  // Analyze betting patterns this hand
  function analyzeBettingPattern() {
    if(gameState.playerBetSizes.length === 0) return { suspicious: false, aggression: 0 };
    
    const avgBet = gameState.playerBetSizes.reduce((a, b) => a + b, 0) / gameState.playerBetSizes.length;
    const potRelative = avgBet / Math.max(gameState.pot * 0.5, 10);
    
    // Suspicious patterns: very large bets, increasing bet sizes, etc.
    const largeBets = gameState.playerBetSizes.filter(b => b > gameState.pot * 0.8).length;
    const increasing = gameState.playerBetSizes.length > 1 && 
                       gameState.playerBetSizes[gameState.playerBetSizes.length - 1] > 
                       gameState.playerBetSizes[0] * 1.5;
    
    return {
      suspicious: largeBets > 0 || increasing,
      aggression: Math.min(potRelative, 2)
    };
  }
  
  // Get betting action based on game theory with bluff detection
  function getOptimalAction(equity, potOdds, potSize, chips, phase, playerBetSize) {
    // Get player profiling data
    const bluffLikelihood = getBluffLikelihood();
    const bettingPattern = analyzeBettingPattern();
    
    // Adjust equity based on bluff detection
    let adjustedEquity = equity;
    if(playerBetSize > 0) {
      // If player is betting and we think they're bluffing, our equity increases
      const bluffAdjustment = (bluffLikelihood - 0.5) * 0.15; // Max ±7.5% equity adjustment
      adjustedEquity = Math.max(0.1, Math.min(0.95, equity + bluffAdjustment));
      
      // Extra adjustment if betting pattern is suspicious
      if(bettingPattern.suspicious) {
        adjustedEquity += 0.05;
      }
    }
    
    // Bluffing frequency based on optimal game theory
    const bluffFreq = Math.random() < 0.12;
    
    // Adjust strategy based on phase - more aggressive preflop
    const phaseAggression = {
      'preflop': 1.2, // Much more aggressive preflop
      'flop': 0.8,
      'turn': 0.9,
      'river': 1.0
    };
    const aggression = phaseAggression[phase] || 0.8;
    
    // Expected value calculation
    const callEV = adjustedEquity * potSize - (1 - adjustedEquity) * (potOdds * potSize);
    
    // Decision thresholds (adjusted for optimal play and phase)
    let foldThreshold = potOdds * 0.85;
    let callThreshold = potOdds * 1.2;
    let raiseThreshold = 0.55 + (1 - aggression) * 0.1;
    
    // Preflop: much more willing to play
    if(phase === 'preflop') {
      foldThreshold = Math.max(0.25, potOdds * 0.7); // Only fold really bad hands preflop
      callThreshold = Math.max(0.35, potOdds * 1.0);
      raiseThreshold = 0.50; // Lower threshold for raising preflop
    }
    
    // If we detect bluffing, be more aggressive
    if(bluffLikelihood > 0.6) {
      foldThreshold *= 0.8;
      callThreshold *= 0.9;
    }
    
    // Strong hand criteria
    const veryStrong = adjustedEquity > 0.75;
    const strong = adjustedEquity > raiseThreshold;
    const medium = adjustedEquity > callThreshold;
    const weak = adjustedEquity > foldThreshold;
    
    // Player bet size tells us information
    const bigBet = playerBetSize > potSize * 0.7;
    const mediumBet = playerBetSize > potSize * 0.4;
    
    // Determine action
    if(veryStrong || (bluffFreq && Math.random() < 0.3)) {
      // Value bet or semi-bluff
      if(Math.random() < 0.7 || veryStrong) {
        return { action: 'raise', multiplier: veryStrong ? (1.5 + Math.random() * 1.0) : (0.7 + Math.random() * 0.5) };
      }
      return { action: 'call' };
    } else if(strong) {
      // Good hand - bet for value or call
      if(playerBetSize === 0 && Math.random() < 0.6) {
        return { action: 'raise', multiplier: 0.6 + Math.random() * 0.6 };
      }
      // Call down suspected bluffs
      if(bigBet && bluffLikelihood > 0.55) {
        return { action: 'call' };
      }
      if(bigBet && Math.random() < 0.2) {
        return { action: 'fold' }; // Sometimes fold to big bets
      }
      return { action: 'call' };
    } else if(medium) {
      // Marginal hand - call if price is right or if we suspect bluff
      if(callEV > 0 || potOdds < adjustedEquity * 0.7) {
        return { action: 'call' };
      }
      // Bluff catch with medium hands if player is bluffy
      if(playerBetSize > 0 && bluffLikelihood > 0.65 && !bigBet) {
        return { action: 'call' };
      }
      if(bluffFreq && playerBetSize === 0) {
        return { action: 'raise', multiplier: 0.5 + Math.random() * 0.4 };
      }
      return { action: 'fold' };
    } else if(weak) {
      // Weak hand but pot odds justify call
      if(potOdds < adjustedEquity * 0.8 && !bigBet) {
        return { action: 'call' };
      }
      // Hero call if we strongly suspect bluff
      if(phase === 'river' && bluffLikelihood > 0.75 && bettingPattern.suspicious) {
        return { action: 'call' };
      }
      return { action: 'fold' };
    } else {
      // Very weak hand
      if(playerBetSize === 0 && bluffFreq) {
        return { action: 'raise', multiplier: 0.4 + Math.random() * 0.3 };
      }
      return { action: 'fold' };
    }
  }
  
  // Advanced dealer AI
  function dealerAction() {
    if(!gameState.gameActive) return;
    
    const dealerCards = [...gameState.dealerHand, ...gameState.communityCards];
    
    // Calculate equity based on game phase
    let equity;
    if(gameState.communityCards.length === 0) {
      // Preflop - use Chen formula
      equity = getPreflopStrength(gameState.dealerHand[0], gameState.dealerHand[1]);
    } else {
      // Postflop - use Monte Carlo simulation
      equity = calculateEquity(gameState.dealerHand, gameState.communityCards, 800);
    }
    
    // Calculate pot odds
    const callAmount = gameState.playerBet - gameState.dealerBet;
    const potOdds = callAmount > 0 ? getPotOdds(callAmount, gameState.pot) : 0;
    
    // Get optimal action
    const decision = getOptimalAction(
      equity, 
      potOdds, 
      gameState.pot,
      gameState.dealerChips,
      gameState.phase,
      gameState.playerBet
    );
    
    if(decision.action === 'raise') {
      // Calculate raise size based on pot and hand strength
      const baseBet = gameState.playerBet > 0 ? gameState.playerBet : Math.max(10, gameState.pot * 0.3);
      const raiseAmount = Math.floor(baseBet + gameState.pot * decision.multiplier);
      const totalBet = Math.max(raiseAmount, gameState.playerBet + 10);
      
      // Don't raise more than player can afford to call
      const playerBalance = vc.readBalance();
      const maxDealerBet = gameState.playerBet + playerBalance;
      const cappedTotalBet = Math.min(totalBet, maxDealerBet);
      
      // If capped bet is not significantly higher than current bet, just call/check instead
      if(cappedTotalBet <= gameState.dealerBet + 5) {
        // Not worth raising if we can't raise enough, just call/check
        if(callAmount > 0) {
          if(callAmount <= gameState.dealerChips) {
            gameState.dealerChips -= callAmount;
            gameState.pot += callAmount;
            gameState.dealerBet = gameState.playerBet;
            appendLog("Dealer calls");
          } else {
            gameState.pot += gameState.dealerChips;
            gameState.dealerBet += gameState.dealerChips;
            gameState.dealerChips = 0;
            appendLog("Dealer calls all-in");
          }
        } else {
          appendLog("Dealer checks");
        }
        nextPhase();
        return;
      }
      
      if(cappedTotalBet > gameState.dealerBet && cappedTotalBet - gameState.dealerBet <= gameState.dealerChips) {
        const additionalBet = cappedTotalBet - gameState.dealerBet;
        gameState.dealerChips -= additionalBet;
        gameState.pot += additionalBet;
        gameState.dealerBet = cappedTotalBet;
        appendLog(`Dealer raises to $${cappedTotalBet}`);
        updateUI();
        updateButtons();
        return;
      }
    }
    
    if(decision.action === 'call' || (decision.action === 'raise' && callAmount > 0)) {
      if(callAmount > 0) {
        if(callAmount <= gameState.dealerChips) {
          gameState.dealerChips -= callAmount;
          gameState.pot += callAmount;
          gameState.dealerBet = gameState.playerBet;
          appendLog("Dealer calls");
        } else {
          // Not enough chips to call - all in
          gameState.pot += gameState.dealerChips;
          gameState.dealerBet += gameState.dealerChips;
          gameState.dealerChips = 0;
          appendLog("Dealer calls all-in");
        }
      } else {
        appendLog("Dealer checks");
      }
      nextPhase();
    } else if(decision.action === 'fold') {
      if(gameState.playerBet > gameState.dealerBet) {
        // Fold to player bet
        gameState.gameActive = false;
        let balance = vc.readBalance();
        balance += gameState.pot;
        vc.writeBalance(balance);
        appendLog("Dealer folds! You win the pot!");
        gameStatusEl.textContent = "Dealer folded. Deal new hand to continue.";
        vc.confetti(30);
        vc.showBigMessage(`Dealer folded! +$${gameState.pot}`, 1400);
        updateUI();
        updateButtons();
      } else {
        // Check instead of folding when there's no bet
        appendLog("Dealer checks");
        nextPhase();
      }
    }
  }

  function dealerRespondToRaise(playerRaise) {
    if(!gameState.gameActive) return;
    
    // Calculate equity
    let equity;
    if(gameState.communityCards.length === 0) {
      equity = getPreflopStrength(gameState.dealerHand[0], gameState.dealerHand[1]);
    } else {
      equity = calculateEquity(gameState.dealerHand, gameState.communityCards, 800);
    }
    
    const callAmount = playerRaise - gameState.dealerBet;
    const potOdds = getPotOdds(callAmount, gameState.pot);
    
    // Get decision
    const decision = getOptimalAction(
      equity,
      potOdds,
      gameState.pot,
      gameState.dealerChips,
      gameState.phase,
      playerRaise
    );
    
    if(decision.action === 'fold') {
      // Dealer folds to raise
      gameState.gameActive = false;
      let balance = vc.readBalance();
      balance += gameState.pot;
      vc.writeBalance(balance);
      appendLog("Dealer folds to your raise! You win the pot!");
      gameStatusEl.textContent = "Dealer folded. Deal new hand to continue.";
      vc.confetti(30);
      vc.showBigMessage(`Dealer folded! +$${gameState.pot}`, 1400);
      updateUI();
      updateButtons();
    } else if(decision.action === 'raise' && equity > 0.7) {
      // Re-raise with very strong hand
      const reraiseAmount = Math.floor(playerRaise + gameState.pot * 0.8);
      
      // Don't re-raise more than player can afford to call
      const playerBalance = vc.readBalance();
      const maxDealerBet = gameState.playerBet + playerBalance;
      const cappedReraiseAmount = Math.min(reraiseAmount, maxDealerBet);
      
      // If capped re-raise is not significantly higher, just call instead
      if(cappedReraiseAmount <= gameState.dealerBet + 5 || cappedReraiseAmount <= playerRaise + 5) {
        // Just call instead of re-raising
        if(callAmount <= gameState.dealerChips) {
          gameState.dealerChips -= callAmount;
          gameState.dealerBet = playerRaise;
          gameState.pot += callAmount;
          appendLog(`Dealer calls your raise`);
        } else {
          gameState.pot += gameState.dealerChips;
          gameState.dealerBet += gameState.dealerChips;
          gameState.dealerChips = 0;
          appendLog(`Dealer calls all-in`);
        }
        nextPhase();
        return;
      }
      
      if(cappedReraiseAmount > gameState.dealerBet && cappedReraiseAmount - gameState.dealerBet <= gameState.dealerChips) {
        const additionalBet = cappedReraiseAmount - gameState.dealerBet;
        gameState.dealerChips -= additionalBet;
        gameState.dealerBet = cappedReraiseAmount;
        gameState.pot += additionalBet;
        appendLog(`Dealer re-raises to $${cappedReraiseAmount}!`);
        updateUI();
        updateButtons();
        return;
      } else {
        // Not enough for reraise, just call
        gameState.dealerChips -= callAmount;
        gameState.dealerBet = playerRaise;
        gameState.pot += callAmount;
        appendLog(`Dealer calls your raise`);
        nextPhase();
      }
    } else {
      // Call the raise
      if(callAmount <= gameState.dealerChips) {
        gameState.dealerChips -= callAmount;
        gameState.dealerBet = playerRaise;
        gameState.pot += callAmount;
        appendLog(`Dealer calls your raise`);
      } else {
        // All in
        gameState.pot += gameState.dealerChips;
        gameState.dealerBet += gameState.dealerChips;
        gameState.dealerChips = 0;
        appendLog(`Dealer calls all-in`);
      }
      nextPhase();
    }
  }

  // Quick bet buttons for ante
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount;
      betInput.value = amount;
    });
  });
  
  // Quick raise buttons
  document.querySelectorAll('.quick-raise-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount;
      if (amount === 'pot') {
        raiseAmountInput.value = gameState.pot + gameState.dealerBet;
      } else {
        raiseAmountInput.value = amount;
      }
    });
  });

  // Event listeners
  dealBtn && dealBtn.addEventListener('click', startNewHand);
  foldBtn && foldBtn.addEventListener('click', fold);
  callBtn && callBtn.addEventListener('click', call);
  checkBtn && checkBtn.addEventListener('click', check);
  raiseBtn && raiseBtn.addEventListener('click', raise);
  betBtn && betBtn.addEventListener('click', bet);

  // Initialize
  updateUI();
  updateButtons();
});
