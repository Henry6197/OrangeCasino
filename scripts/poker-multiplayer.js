document.addEventListener('DOMContentLoaded', ()=>{
  // Multi-player Texas Hold'em Poker Implementation
  const dealBtn = document.getElementById('deal-btn');
  const foldBtn = document.getElementById('fold-btn');
  const callBtn = document.getElementById('call-btn');
  const raiseBtn = document.getElementById('raise-btn');
  const checkBtn = document.getElementById('check-btn');
  const betBtn = document.getElementById('bet-btn');
  const numPlayersSelect = document.getElementById('num-players');
  
  const log = document.getElementById('poker-log');
  const playersContainer = document.getElementById('poker-players');
  const communityEl = document.getElementById('community-cards');
  const betInput = document.getElementById('poker-bet');
  const raiseAmountInput = document.getElementById('raise-amount');
  const gameStatusEl = document.getElementById('game-status');
  const potAmountEl = document.getElementById('pot-amount');

  // AI player names
  const AI_NAMES = ['🎩 Ace', '🦊 Fox', '🐻 Bear', '🦅 Hawk', '🐺 Wolf', '🦁 Leo', '🐯 Tiger'];
  
  // Game state
  let gameState = {
    deck: [],
    players: [], // Array of player objects
    communityCards: [],
    pot: 0,
    currentBet: 0,
    phase: 'waiting',
    activePlayerIndex: 0,
    dealerButtonIndex: 0,
    gameActive: false,
    playerActionsThisRound: []
  };

  // Player stats for AI bluff detection
  let aiStats = {}; // Keyed by player ID

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
  
  function createCardElement(card, hideCard = false, animationDelay = 0) {
    const cardEl = document.createElement('div');
    cardEl.className = 'playing-card poker-card';
    cardEl.style.animationDelay = `${animationDelay}s`;
    
    if (hideCard) {
      cardEl.classList.add('face-down');
      cardEl.innerHTML = `<div class="card-back"><div class="card-back-pattern"></div></div>`;
    } else {
      const isRed = ['♥', '♦'].includes(card.suit);
      cardEl.classList.add(isRed ? 'red' : 'black');
      
      cardEl.innerHTML = `
        <div class="card-front">
          <div class="card-corner top-left">
            <div class="rank">${card.rank}</div>
            <div class="suit">${card.suit}</div>
          </div>
          <div class="card-center">
            <div class="suit-large">${card.suit}</div>
          </div>
          <div class="card-corner bottom-right">
            <div class="rank">${card.rank}</div>
            <div class="suit">${card.suit}</div>
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

  // Hand evaluation
  function rankValue(r){ 
    if(r==='A') return 14; 
    if(r==='K') return 13; 
    if(r==='Q') return 12; 
    if(r==='J') return 11; 
    return Number(r); 
  }

  function evaluateHand(cards) {
    if(cards.length < 5) return {rank: 0, name: 'No Hand', kickers: []};
    
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
    const isLowStraight = ranks.join('') === '14,5,4,3,2';
    
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

  // Initialize players
  function initializePlayers() {
    const numPlayers = Number(numPlayersSelect.value);
    const players = [];
    
    // Add human player
    players.push({
      id: 0,
      name: '👤 You',
      isHuman: true,
      chips: vc.readBalance(),
      hand: [],
      bet: 0,
      folded: false,
      allIn: false
    });
    
    // Add AI players
    for(let i = 1; i < numPlayers; i++) {
      players.push({
        id: i,
        name: AI_NAMES[i-1],
        isHuman: false,
        chips: 1000,
        hand: [],
        bet: 0,
        folded: false,
        allIn: false
      });
      
      // Initialize AI stats
      if(!aiStats[i]) {
        aiStats[i] = {
          totalHands: 0,
          preflopRaises: 0,
          showdownHands: [],
          bigBluffs: 0,
          valueBets: 0
        };
      }
    }
    
    return players;
  }

  // Render players on table
  function renderPlayers() {
    playersContainer.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'poker-player';
      if(player.isHuman) playerDiv.classList.add('human-player');
      if(player.folded) playerDiv.classList.add('folded');
      if(index === gameState.activePlayerIndex && gameState.gameActive) playerDiv.classList.add('active-turn');
      if(index === gameState.dealerButtonIndex) playerDiv.classList.add('dealer-button');
      
      const handDiv = document.createElement('div');
      handDiv.className = 'card-row';
      handDiv.id = `player-${player.id}-hand`;
      
      player.hand.forEach((card, i) => {
        const hideCard = !player.isHuman && gameState.phase !== 'showdown';
        const cardEl = createCardElement(card, hideCard, i * 0.1);
        handDiv.appendChild(cardEl);
      });
      
      // Show hand strength
      if(gameState.communityCards.length > 0 && player.hand.length > 0 && !player.folded) {
        const cards = [...player.hand, ...gameState.communityCards];
        const hand = evaluateHand(cards);
        if(player.isHuman || gameState.phase === 'showdown') {
          const strengthEl = document.createElement('div');
          strengthEl.className = 'hand-strength-indicator';
          strengthEl.textContent = hand.name;
          handDiv.appendChild(strengthEl);
        }
      }
      
      playerDiv.innerHTML = `
        <div class="player-info">
          <h4>${player.name}${index === gameState.dealerButtonIndex ? ' 🔘' : ''}</h4>
          <div class="chip-display">Chips: $${player.chips}</div>
          <div class="bet-display">Bet: $${player.bet}</div>
          ${player.folded ? '<div class="fold-indicator">FOLDED</div>' : ''}
          ${player.allIn ? '<div class="allin-indicator">ALL-IN</div>' : ''}
        </div>
      `;
      playerDiv.appendChild(handDiv);
      
      playersContainer.appendChild(playerDiv);
    });
  }

  // UI Updates
  function updateUI() {
    potAmountEl.textContent = gameState.pot;
    
    // Update community cards
    communityEl.innerHTML = '';
    gameState.communityCards.forEach((card, i) => {
      const cardEl = createCardElement(card, false, i * 0.15);
      communityEl.appendChild(cardEl);
    });
    
    renderPlayers();
  }

  function updateButtons() {
    const canAct = gameState.gameActive && gameState.phase !== 'showdown';
    const isPlayerTurn = gameState.players[gameState.activePlayerIndex].isHuman;
    const canPlayerAct = canAct && isPlayerTurn && !gameState.players[0].folded;
    
    foldBtn.disabled = !canPlayerAct;
    
    const player = gameState.players[0];
    const callAmount = gameState.currentBet - player.bet;
    
    if(callAmount > 0) {
      callBtn.disabled = !canPlayerAct;
      callBtn.textContent = `📞 Call $${callAmount}`;
      checkBtn.disabled = true;
      betBtn.disabled = true;
    } else {
      callBtn.disabled = true;
      checkBtn.disabled = !canPlayerAct;
      betBtn.disabled = !canPlayerAct;
    }
    
    raiseBtn.disabled = !canPlayerAct;
  }

  // Game flow
  function startNewHand() {
    const ante = Number(betInput.value || 10);
    const balance = vc.readBalance();
    
    if(ante <= 0) {
      appendLog('Invalid bet amount.');
      return;
    }
    
    if(ante > balance) {
      appendLog('Insufficient funds for ante.');
      vc.setBuddyText('Not enough funds — lower the ante.');
      return;
    }
    
    // Initialize players
    gameState.players = initializePlayers();
    gameState.deck = makeDeck();
    shuffle(gameState.deck);
    gameState.communityCards = [];
    gameState.pot = 0;
    gameState.currentBet = ante;
    gameState.phase = 'preflop';
    gameState.gameActive = true;
    gameState.playerActionsThisRound = [];
    
    // Move dealer button
    gameState.dealerButtonIndex = (gameState.dealerButtonIndex + 1) % gameState.players.length;
    gameState.activePlayerIndex = (gameState.dealerButtonIndex + 1) % gameState.players.length;
    
    // Post antes
    gameState.players.forEach((player, i) => {
      if(player.isHuman) {
        const newBalance = vc.readBalance() - ante;
        vc.writeBalance(newBalance);
        player.chips = newBalance;
      } else {
        player.chips -= ante;
      }
      player.bet = ante;
      player.folded = false;
      player.allIn = false;
      gameState.pot += ante;
    });
    
    // Deal hole cards
    gameState.players.forEach(player => {
      player.hand = [gameState.deck.pop(), gameState.deck.pop()];
    });
    
    try{ if(window.vc && typeof window.vc.incrementPokerPlays === 'function') window.vc.incrementPokerPlays(1); }catch(e){}
    
    gameStatusEl.textContent = "Pre-flop: Your turn to act";
    appendLog(`New hand started. Antes: $${ante} each`);
    
    updateUI();
    updateButtons();
    
    // If not human's turn, process AI
    if(!gameState.players[gameState.activePlayerIndex].isHuman) {
      setTimeout(processAITurn, 1500);
    }
  }

  function nextPlayer() {
    const startIndex = gameState.activePlayerIndex;
    let nextIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
    let attempts = 0;
    
    // Skip folded players, but prevent infinite loop
    while(gameState.players[nextIndex].folded && attempts < gameState.players.length) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
      attempts++;
    }
    
    // If we've checked all players and all are folded, go to showdown
    if(attempts >= gameState.players.length || gameState.players.filter(p => !p.folded).length <= 1) {
      showdown();
      return;
    }
    
    gameState.activePlayerIndex = nextIndex;
    updateUI();
    updateButtons();
  }

  function isBettingRoundComplete() {
    const activePlayers = gameState.players.filter(p => !p.folded);
    if(activePlayers.length === 1) return true;
    
    // Check if all active players have acted and matched the current bet
    const allMatched = activePlayers.every(p => p.bet === gameState.currentBet || p.allIn);
    const allActed = gameState.playerActionsThisRound.length >= activePlayers.length;
    
    return allMatched && allActed;
  }

  function nextPhase() {
    gameState.playerActionsThisRound = [];
    gameState.currentBet = 0;
    gameState.players.forEach(p => p.bet = 0);
    
    if(gameState.phase === 'preflop') {
      dealFlop();
    } else if(gameState.phase === 'flop') {
      dealTurn();
    } else if(gameState.phase === 'turn') {
      dealRiver();
    } else if(gameState.phase === 'river') {
      showdown();
    }
  }

  function dealFlop() {
    gameState.deck.pop(); // burn
    gameState.communityCards.push(
      gameState.deck.pop(),
      gameState.deck.pop(),
      gameState.deck.pop()
    );
    
    gameState.phase = 'flop';
    gameState.activePlayerIndex = (gameState.dealerButtonIndex + 1) % gameState.players.length;
    gameStatusEl.textContent = "Flop: Betting round";
    appendLog("Flop dealt");
    
    updateUI();
    updateButtons();
    
    if(!gameState.players[gameState.activePlayerIndex].isHuman) {
      setTimeout(processAITurn, 1500);
    }
  }

  function dealTurn() {
    gameState.deck.pop(); // burn
    gameState.communityCards.push(gameState.deck.pop());
    
    gameState.phase = 'turn';
    gameState.activePlayerIndex = (gameState.dealerButtonIndex + 1) % gameState.players.length;
    gameStatusEl.textContent = "Turn: Betting round";
    appendLog("Turn card dealt");
    
    updateUI();
    updateButtons();
    
    if(!gameState.players[gameState.activePlayerIndex].isHuman) {
      setTimeout(processAITurn, 1500);
    }
  }

  function dealRiver() {
    gameState.deck.pop(); // burn
    gameState.communityCards.push(gameState.deck.pop());
    
    gameState.phase = 'river';
    gameState.activePlayerIndex = (gameState.dealerButtonIndex + 1) % gameState.players.length;
    gameStatusEl.textContent = "River: Final betting round";
    appendLog("River card dealt");
    
    updateUI();
    updateButtons();
    
    if(!gameState.players[gameState.activePlayerIndex].isHuman) {
      setTimeout(processAITurn, 1500);
    }
  }

  function showdown() {
    gameState.phase = 'showdown';
    gameState.gameActive = false;
    
    const activePlayers = gameState.players.filter(p => !p.folded);
    
    if(activePlayers.length === 1) {
      // Everyone else folded
      const winner = activePlayers[0];
      winner.chips += gameState.pot;
      if(winner.isHuman) {
        vc.writeBalance(winner.chips);
        vc.confetti(30);
        vc.showBigMessage(`You won $${gameState.pot}!`, 1400);
      }
      appendLog(`${winner.name} wins $${gameState.pot} (others folded)`);
    } else {
      // Evaluate hands
      const hands = activePlayers.map(p => ({
        player: p,
        hand: evaluateHand([...p.hand, ...gameState.communityCards])
      }));
      
      hands.sort((a, b) => {
        if(b.hand.rank !== a.hand.rank) return b.hand.rank - a.hand.rank;
        return compareKickers(b.hand.kickers, a.hand.kickers);
      });
      
      const winners = [hands[0]];
      for(let i = 1; i < hands.length; i++) {
        if(hands[i].hand.rank === hands[0].hand.rank && 
           compareKickers(hands[i].hand.kickers, hands[0].hand.kickers) === 0) {
          winners.push(hands[i]);
        } else {
          break;
        }
      }
      
      const share = Math.floor(gameState.pot / winners.length);
      winners.forEach(w => {
        w.player.chips += share;
        if(w.player.isHuman) {
          vc.writeBalance(w.player.chips);
          vc.confetti(40);
          vc.showBigMessage(`You won $${share}!`, 1400);
        }
        appendLog(`${w.player.name} wins $${share} with ${w.hand.name}`);
      });
    }
    
    gameStatusEl.textContent = "Hand complete. Deal new hand to continue.";
    updateUI();
  }

  // Player actions
  function fold() {
    const player = gameState.players[0];
    player.folded = true;
    appendLog("You folded");
    gameState.playerActionsThisRound.push({playerId: player.id, action: 'fold'});
    updateUI();
    
    const activePlayers = gameState.players.filter(p => !p.folded);
    if(activePlayers.length === 1) {
      setTimeout(showdown, 500);
      return;
    }
    
    nextPlayer();
    if(gameState.players[gameState.activePlayerIndex] && !gameState.players[gameState.activePlayerIndex].isHuman && !gameState.players[gameState.activePlayerIndex].folded) {
      setTimeout(processAITurn, 1000);
    }
  }

  function call() {
    const player = gameState.players[0];
    const callAmount = gameState.currentBet - player.bet;
    
    if(callAmount > player.chips) {
      appendLog('Insufficient funds to call.');
      return;
    }
    
    player.chips -= callAmount;
    vc.writeBalance(player.chips);
    player.bet += callAmount;
    gameState.pot += callAmount;
    
    appendLog(`You called $${callAmount}`);
    gameState.playerActionsThisRound.push({playerId: player.id, action: 'call'});
    
    if(isBettingRoundComplete()) {
      nextPhase();
    } else {
      nextPlayer();
      if(!gameState.players[gameState.activePlayerIndex].isHuman) {
        setTimeout(processAITurn, 1000);
      }
    }
  }

  function check() {
    appendLog("You checked");
    gameState.playerActionsThisRound.push({playerId: 0, action: 'check'});
    
    if(isBettingRoundComplete()) {
      nextPhase();
    } else {
      nextPlayer();
      if(!gameState.players[gameState.activePlayerIndex].isHuman) {
        setTimeout(processAITurn, 1000);
      }
    }
  }

  function bet() {
    const player = gameState.players[0];
    const betAmount = Number(betInput.value || 10);
    
    if(betAmount <= 0 || betAmount > player.chips) {
      appendLog('Invalid bet amount.');
      return;
    }
    
    player.chips -= betAmount;
    vc.writeBalance(player.chips);
    player.bet += betAmount;
    gameState.pot += betAmount;
    gameState.currentBet = Math.max(gameState.currentBet, player.bet);
    
    appendLog(`You bet $${betAmount}`);
    gameState.playerActionsThisRound.push({playerId: player.id, action: 'bet', amount: betAmount});
    
    nextPlayer();
    if(!gameState.players[gameState.activePlayerIndex].isHuman) {
      setTimeout(processAITurn, 1000);
    }
  }

  function raise() {
    const player = gameState.players[0];
    const raiseAmount = Number(raiseAmountInput.value || 20);
    const totalBet = Math.max(raiseAmount, gameState.currentBet + 10);
    const additionalBet = totalBet - player.bet;
    
    if(additionalBet > player.chips) {
      appendLog('Insufficient funds to raise.');
      return;
    }
    
    player.chips -= additionalBet;
    vc.writeBalance(player.chips);
    player.bet = totalBet;
    gameState.pot += additionalBet;
    gameState.currentBet = totalBet;
    
    appendLog(`You raised to $${totalBet}`);
    gameState.playerActionsThisRound.push({playerId: player.id, action: 'raise', amount: totalBet});
    
    nextPlayer();
    if(!gameState.players[gameState.activePlayerIndex].isHuman) {
      setTimeout(processAITurn, 1000);
    }
  }

  // AI Logic (reusing advanced AI from previous version)
  function calculateEquity(holeCards, communityCards, numSimulations = 500) {
    let wins = 0;
    let ties = 0;
    
    for(let sim = 0; sim < numSimulations; sim++) {
      const knownCards = [...holeCards, ...communityCards];
      const simulationDeck = makeDeck().filter(card => 
        !knownCards.some(known => known.rank === card.rank && known.suit === card.suit)
      );
      shuffle(simulationDeck);
      
      const oppCards = [simulationDeck.pop(), simulationDeck.pop()];
      const simCommunity = [...communityCards];
      while(simCommunity.length < 5) {
        simCommunity.push(simulationDeck.pop());
      }
      
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
  
  function getPreflopStrength(card1, card2) {
    const rank1 = rankValue(card1.rank);
    const rank2 = rankValue(card2.rank);
    const highCard = Math.max(rank1, rank2);
    const lowCard = Math.min(rank1, rank2);
    const suited = card1.suit === card2.suit;
    const paired = rank1 === rank2;
    const gap = highCard - lowCard - 1;
    
    let score = 0;
    
    if(highCard === 14) score = 10;
    else if(highCard === 13) score = 8;
    else if(highCard === 12) score = 7;
    else if(highCard === 11) score = 6;
    else score = highCard / 2;
    
    if(paired) {
      score *= 2;
      if(score < 5) score = 5;
    }
    
    if(suited) score += 2;
    
    if(!paired) {
      if(gap === 0) score += 1;
      else if(gap === 1) score += 0;
      else if(gap === 2) score -= 1;
      else if(gap === 3) score -= 2;
      else score -= 4;
      
      if(gap <= 1 && highCard < 12) score -= 1;
    }
    
    return Math.max(score, 0) / 20;
  }

  function getAIAction(player) {
    let equity;
    if(gameState.communityCards.length === 0) {
      equity = getPreflopStrength(player.hand[0], player.hand[1]);
    } else {
      equity = calculateEquity(player.hand, gameState.communityCards, 400);
    }
    
    const callAmount = gameState.currentBet - player.bet;
    const potOdds = callAmount > 0 ? callAmount / (gameState.pot + callAmount) : 0;
    
    // Simplified AI decision
    const rand = Math.random();
    
    if(gameState.phase === 'preflop') {
      if(equity > 0.65 && rand < 0.7) return {action: 'raise', amount: Math.min(gameState.currentBet + 20, player.chips + player.bet)};
      if(equity > 0.35) return {action: callAmount > 0 ? 'call' : 'check'};
      if(callAmount === 0) return {action: 'check'};
      if(callAmount < player.chips * 0.2 && equity > 0.25) return {action: 'call'};
      return {action: 'fold'};
    } else {
      if(equity > 0.75 && rand < 0.6) return {action: 'raise', amount: Math.min(Math.floor(gameState.pot * 0.7), player.chips + player.bet)};
      if(equity > 0.55 && callAmount > 0) return {action: 'call'};
      if(equity > 0.45) return {action: callAmount > 0 ? 'call' : 'check'};
      if(callAmount === 0 && rand < 0.3) return {action: 'bet', amount: Math.min(Math.floor(gameState.pot * 0.5), player.chips)};
      if(callAmount < player.chips * 0.3 && equity > 0.35) return {action: 'call'};
      if(callAmount > 0) return {action: 'fold'};
      return {action: 'check'};
    }
  }

  function processAITurn() {
    if(!gameState.gameActive || gameState.phase === 'showdown') return;
    
    const player = gameState.players[gameState.activePlayerIndex];
    if(!player || player.isHuman || player.folded) {
      // If somehow a folded/invalid player got here, move to next
      const activePlayers = gameState.players.filter(p => !p.folded);
      if(activePlayers.length <= 1) {
        showdown();
        return;
      }
      nextPlayer();
      if(!gameState.players[gameState.activePlayerIndex].isHuman) {
        setTimeout(processAITurn, 500);
      }
      return;
    }
    
    const decision = getAIAction(player);
    
    if(decision.action === 'fold') {
      player.folded = true;
      appendLog(`${player.name} folds`);
      updateUI();
      
      const activePlayers = gameState.players.filter(p => !p.folded);
      if(activePlayers.length === 1) {
        setTimeout(showdown, 800);
        return;
      }
    } else if(decision.action === 'call') {
      const callAmount = gameState.currentBet - player.bet;
      player.chips -= callAmount;
      player.bet += callAmount;
      gameState.pot += callAmount;
      appendLog(`${player.name} calls $${callAmount}`);
    } else if(decision.action === 'check') {
      appendLog(`${player.name} checks`);
    } else if(decision.action === 'bet' || decision.action === 'raise') {
      const betAmount = Math.min(decision.amount - player.bet, player.chips);
      player.chips -= betAmount;
      player.bet += betAmount;
      gameState.pot += betAmount;
      gameState.currentBet = Math.max(gameState.currentBet, player.bet);
      appendLog(`${player.name} ${decision.action}s to $${player.bet}`);
    }
    
    gameState.playerActionsThisRound.push({playerId: player.id, action: decision.action});
    updateUI();
    
    if(isBettingRoundComplete()) {
      setTimeout(nextPhase, 1000);
    } else {
      nextPlayer();
      if(!gameState.players[gameState.activePlayerIndex].isHuman) {
        setTimeout(processAITurn, 1000);
      } else {
        updateButtons();
      }
    }
  }

  // Event listeners
  dealBtn && dealBtn.addEventListener('click', startNewHand);
  foldBtn && foldBtn.addEventListener('click', fold);
  callBtn && callBtn.addEventListener('click', call);
  checkBtn && checkBtn.addEventListener('click', check);
  raiseBtn && raiseBtn.addEventListener('click', raise);
  betBtn && betBtn.addEventListener('click', bet);

  // Quick bet buttons
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      betInput.value = btn.dataset.amount;
    });
  });
  
  document.querySelectorAll('.quick-raise-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount;
      if (amount === 'pot') {
        raiseAmountInput.value = gameState.pot + gameState.currentBet;
      } else {
        raiseAmountInput.value = amount;
      }
    });
  });

  // Initialize
  updateUI();
  updateButtons();
});
