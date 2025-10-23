document.addEventListener('DOMContentLoaded', ()=>{
  // Texas Hold'em Poker Implementation
  const dealBtn = document.getElementById('deal-btn');
  const foldBtn = document.getElementById('fold-btn');
  const callBtn = document.getElementById('call-btn');
  const raiseBtn = document.getElementById('raise-btn');
  const checkBtn = document.getElementById('check-btn');
  
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
    gameActive: false
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
    gameState.communityCards.forEach(card => {
      const div = document.createElement('div');
      div.className = 'chip';
      div.textContent = cardToStr(card);
      communityEl.appendChild(div);
    });
    
    // Update player hand
    playerEl.innerHTML = '';
    gameState.playerHand.forEach(card => {
      const div = document.createElement('div');
      div.className = 'chip';
      div.textContent = cardToStr(card);
      playerEl.appendChild(div);
    });
    
    // Update dealer hand
    dealerEl.innerHTML = '';
    gameState.dealerHand.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = 'chip';
      div.textContent = (gameState.phase === 'showdown') ? cardToStr(card) : '🂠';
      dealerEl.appendChild(div);
    });
  }

  function updateButtons() {
    const canAct = gameState.gameActive && gameState.phase !== 'showdown';
    foldBtn.disabled = !canAct;
    
    if(gameState.dealerBet > gameState.playerBet) {
      callBtn.disabled = !canAct;
      callBtn.textContent = `Call $${gameState.dealerBet - gameState.playerBet}`;
      checkBtn.disabled = true;
    } else {
      callBtn.disabled = true;
      checkBtn.disabled = !canAct;
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
      gameActive: true
    };
    
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
    gameState.dealerBet = gameState.playerBet; // Reset betting
    gameStatusEl.textContent = "Flop: Community cards revealed";
    appendLog("Flop dealt");
    
    updateUI();
    updateButtons();
    
    // Dealer AI decision
    setTimeout(dealerAction, 1000);
  }

  function dealTurn() {
    if(gameState.phase !== 'flop') return;
    
    gameState.deck.pop(); // burn
    gameState.communityCards.push(gameState.deck.pop());
    
    gameState.phase = 'turn';
    gameState.dealerBet = gameState.playerBet;
    gameStatusEl.textContent = "Turn: Fourth community card";
    appendLog("Turn card dealt");
    
    updateUI();
    updateButtons();
    
    setTimeout(dealerAction, 1000);
  }

  function dealRiver() {
    if(gameState.phase !== 'turn') return;
    
    gameState.deck.pop(); // burn
    gameState.communityCards.push(gameState.deck.pop());
    
    gameState.phase = 'river';
    gameState.dealerBet = gameState.playerBet;
    gameStatusEl.textContent = "River: Final community card";
    appendLog("River card dealt");
    
    updateUI();
    updateButtons();
    
    setTimeout(dealerAction, 1000);
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
    
    if(playerHand.rank > dealerHand.rank || 
       (playerHand.rank === dealerHand.rank && compareKickers(playerHand.kickers, dealerHand.kickers) > 0)) {
      winner = 'player';
      balance += gameState.pot;
      vc.writeBalance(balance);
      appendLog(`You win $${gameState.pot}! ${playerHand.name} vs ${dealerHand.name}`);
      vc.confetti(40);
      vc.showBigMessage(`You won $${gameState.pot}!`, 1400);
      vc.setBuddyText('Great hand! You got them!');
    } else if(dealerHand.rank > playerHand.rank ||
              (playerHand.rank === dealerHand.rank && compareKickers(dealerHand.kickers, playerHand.kickers) > 0)) {
      winner = 'dealer';
      gameState.dealerChips += gameState.pot;
      appendLog(`Dealer wins with ${dealerHand.name} vs your ${playerHand.name}`);
      vc.showBigMessage('YOU LOST', 1000);
      vc.setBuddyText('Tough break — try again!');
    } else {
      // Tie
      const split = gameState.pot / 2;
      balance += split;
      gameState.dealerChips += split;
      vc.writeBalance(balance);
      appendLog(`Split pot! Both had ${playerHand.name}`);
      vc.setBuddyText('Split pot — close game!');
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
    
    // Move to next phase
    nextPhase();
  }

  function check() {
    if(!gameState.gameActive) return;
    
    appendLog("You checked");
    nextPhase();
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
    
    appendLog(`You raised to $${totalBet}`);
    
    // Dealer responds to raise
    setTimeout(() => dealerRespondToRaise(totalBet), 1000);
  }

  function nextPhase() {
    updateUI();
    updateButtons();
    
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

  // Simple dealer AI
  function dealerAction() {
    if(!gameState.gameActive) return;
    
    const dealerCards = [...gameState.dealerHand, ...gameState.communityCards];
    const dealerHand = evaluateHand(dealerCards);
    
    // Simple AI logic - dealer never folds
    const handStrength = dealerHand.rank / 9; // 0 to 1
    const random = Math.random();
    
    if(handStrength > 0.6 || (handStrength > 0.3 && random < 0.3)) {
      // Dealer raises
      const raiseAmount = gameState.playerBet + 10 + Math.floor(Math.random() * 20);
      if(raiseAmount <= gameState.dealerChips) {
        gameState.dealerBet = raiseAmount;
        gameState.dealerChips -= (raiseAmount - gameState.dealerBet);
        gameState.pot += (raiseAmount - gameState.dealerBet);
        appendLog(`Dealer raises to $${raiseAmount}`);
        updateButtons();
        return;
      }
    }
    
    // Dealer always checks/calls - never folds
    appendLog("Dealer checks");
    nextPhase();
  }

  function dealerRespondToRaise(playerRaise) {
    if(!gameState.gameActive) return;
    
    const dealerCards = [...gameState.dealerHand, ...gameState.communityCards];
    const dealerHand = evaluateHand(dealerCards);
    const handStrength = dealerHand.rank / 9;
    
    // Dealer always calls raises - never folds
    const callAmount = playerRaise - gameState.dealerBet;
    gameState.dealerChips -= callAmount;
    gameState.dealerBet = playerRaise;
    gameState.pot += callAmount;
    appendLog(`Dealer calls your raise`);
    nextPhase();
  }

  // Event listeners
  dealBtn && dealBtn.addEventListener('click', startNewHand);
  foldBtn && foldBtn.addEventListener('click', fold);
  callBtn && callBtn.addEventListener('click', call);
  checkBtn && checkBtn.addEventListener('click', check);
  raiseBtn && raiseBtn.addEventListener('click', raise);

  // Initialize
  updateUI();
  updateButtons();
});
