document.addEventListener('DOMContentLoaded', ()=>{
  const dealBtn = document.getElementById('deal');
  const hitBtn = document.getElementById('hit');
  const standBtn = document.getElementById('stand');
  const log = document.getElementById('bj-log');
  const dealerEl = document.getElementById('dealer-hand');
  const playerEl = document.getElementById('player-hand');
  const dealerScoreEl = document.getElementById('dealer-score');
  const playerScoreEl = document.getElementById('player-score');
  const betInput = document.getElementById('bj-bet');
  
  // Stats tracking
  let gameStats = {
    handsPlayed: 0,
    handsWon: 0,
    currentStreak: 0,
    bestStreak: 0
  };
  
  // Load stats from localStorage
  function loadStats() {
    const saved = localStorage.getItem('bj_stats');
    if (saved) {
      gameStats = JSON.parse(saved);
      updateStatsDisplay();
    }
  }
  
  // Save stats to localStorage
  function saveStats() {
    localStorage.setItem('bj_stats', JSON.stringify(gameStats));
    updateStatsDisplay();
  }
  
  // Update stats display
  function updateStatsDisplay() {
    document.getElementById('bj-hands-played').textContent = gameStats.handsPlayed;
    document.getElementById('bj-hands-won').textContent = gameStats.handsWon;
    
    const winRate = gameStats.handsPlayed > 0 
      ? Math.round((gameStats.handsWon / gameStats.handsPlayed) * 100) 
      : 0;
    document.getElementById('bj-win-rate').textContent = winRate + '%';
    
    const streakEl = document.getElementById('bj-streak');
    streakEl.textContent = gameStats.currentStreak;
    streakEl.style.color = gameStats.currentStreak > 0 ? '#10b981' : (gameStats.currentStreak < 0 ? '#ef4444' : '#9ca3af');
    
    document.getElementById('bj-best-streak').textContent = gameStats.bestStreak;
  }
  
  // Record game result
  function recordResult(won) {
    gameStats.handsPlayed++;
    
    if (won) {
      gameStats.handsWon++;
      gameStats.currentStreak = Math.max(0, gameStats.currentStreak) + 1;
      if (gameStats.currentStreak > gameStats.bestStreak) {
        gameStats.bestStreak = gameStats.currentStreak;
      }
    } else {
      gameStats.currentStreak = Math.min(0, gameStats.currentStreak) - 1;
    }
    
    saveStats();
  }
  
  // Reset stats
  document.getElementById('reset-bj-stats')?.addEventListener('click', () => {
    if (confirm('Reset all blackjack statistics?')) {
      gameStats = {
        handsPlayed: 0,
        handsWon: 0,
        currentStreak: 0,
        bestStreak: 0
      };
      saveStats();
      vc.setBuddyText('Statistics reset!');
    }
  });
  
  // Quick bet buttons
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount;
      if (amount === 'max') {
        betInput.value = vc.readBalance();
      } else {
        betInput.value = amount;
      }
    });
  });
  
  // Initialize stats
  loadStats();

  let deck = [];
  let dealDelay = 0; // Used for staggered card dealing animation
  
  function makeDeck(){ 
    const suits=['♠','♥','♦','♣']; 
    const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K']; 
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
  
  function value(cards){ 
    let total=0, aces=0; 
    for(const c of cards){ 
      if(c.rank==='A'){ 
        aces++; 
        total+=11 
      } else if(['J','Q','K'].includes(c.rank)) 
        total+=10; 
      else 
        total+=Number(c.rank); 
    } 
    while(total>21 && aces>0){ 
      total-=10; 
      aces--; 
    } 
    return total; 
  }
  
  // Create a proper playing card element with suit and rank
  function createCardElement(card, hideCard = false) {
    const cardEl = document.createElement('div');
    cardEl.className = 'playing-card';
    
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
  
  function showCards(el, cards, hideFirst = false) { 
    el.innerHTML=''; 
    cards.forEach((c, i) => { 
      const cardEl = createCardElement(c, i === 0 && hideFirst);
      cardEl.style.animationDelay = `${i * 0.1}s`;
      el.appendChild(cardEl); 
    }); 
  }
  
  function updateScores(hideDealer=false){ 
    if(playerScoreEl) playerScoreEl.textContent = player.length > 0 ? value(player) : '';
    if(dealerScoreEl) dealerScoreEl.textContent = dealer.length > 0 && !hideDealer ? value(dealer) : (dealer.length > 0 ? '?' : '');
  }
  function appendLog(s){ if(!log) return; const p=document.createElement('div'); p.textContent=s; log.prepend(p); }

    let dealer=[], player=[];
    let roundActive = false; // prevents multiple deals or extra actions after round end
    
    // Initialize empty scores
    updateScores();

    function deal(){
      if(roundActive) return; // block re-deal during active round
      const bet = Number(betInput.value||10);
      let balance = vc.readBalance();
      if(bet <= 0){ appendLog('Invalid bet.'); return; }
      if(bet > balance){ appendLog('Insufficient funds for that bet.'); vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.insufficientFunds || 'Not enough funds — lower the bet or take a loan.'); return; }
      roundActive = true;
      
      // Track blackjack play for achievements
      try{ if(window.vc && typeof window.vc.incrementBlackjackPlays === 'function') window.vc.incrementBlackjackPlays(1); }catch(e){}
      deck = makeDeck(); shuffle(deck); dealer=[]; player=[];
      balance -= bet; vc.writeBalance(balance);
      player.push(deck.pop(), deck.pop()); dealer.push(deck.pop(), deck.pop());
      showCards(playerEl, player); showCards(dealerEl, dealer, true); updateScores(true); appendLog('Dealt.');
      if(value(player)===21){ 
        // Disable buttons during blackjack sequence
        hitBtn.disabled = true;
        standBtn.disabled = true;
        appendLog('BLACKJACK!');
        
        setTimeout(() => {
          appendLog('Dealer reveals hole card...');
          revealDealer(); 
          updateScores(); 
          setTimeout(() => settle(), 800);
        }, 1000);
      }
    }

    function hit(){ 
      if(!roundActive) return; 
      
      player.push(deck.pop()); 
      showCards(playerEl, player); 
      updateScores(true); 
      appendLog('Player hits.'); 
      if(value(player)>21){ 
        // Disable buttons during bust sequence
        hitBtn.disabled = true;
        standBtn.disabled = true;
        
        setTimeout(() => {
          appendLog('Player busted!');
          revealDealer(); 
          updateScores(); 
          setTimeout(() => settle(), 800);
        }, 600);
      } 
    }

    function stand(){ 
      if(!roundActive) return; 
      
      appendLog('Player stands.'); 
      
      // Disable buttons during dealer actions
      hitBtn.disabled = true;
      standBtn.disabled = true;
      
      setTimeout(() => {
        appendLog('Dealer reveals hole card...');
        
        revealDealer(); 
        updateScores(); 
        
        setTimeout(() => {
          dealerDrawCards();
        }, 1000);
      }, 800);
    }
    
    function dealerDrawCards() {
      if(value(dealer) < 17) {
        appendLog('Dealer must hit...');
        dealer.push(deck.pop());
        showCards(dealerEl, dealer);
        updateScores();
        
        setTimeout(() => {
          dealerDrawCards(); // Recursive call with delay
        }, 1200);
      } else {
        setTimeout(() => {
          appendLog('Dealer stands.');
          setTimeout(() => {
            settle();
          }, 600);
        }, 800);
      }
    }

    function revealDealer(){ 
      // Flip the first card with animation
      const firstCard = dealerEl.querySelector('.playing-card');
      if (firstCard && firstCard.classList.contains('face-down')) {
        firstCard.classList.add('flipping');
        setTimeout(() => {
          showCards(dealerEl, dealer, false);
        }, 300);
      } else {
        showCards(dealerEl, dealer, false);
      }
    }

    function settle(){ 
      if(!roundActive) return; 
      roundActive = false; 
      const bet = Number(betInput.value||10); 
      let balance = vc.readBalance(); 
      const pv = value(player), dv = value(dealer);
      
      let playerWon = false;
      
      // Standard blackjack payout logic - no house edge interference
      if(pv > 21) {
        // Player busted - dealer wins
        appendLog('Player busted - lose.'); 
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.playerBust || 'Tough luck — keep going!'); 
        vc.showBigMessage('YOU LOST',1000);
        playerWon = false;
      }
      else if(dv > 21) {
        // Dealer busted - player wins (1:1 payout)
        const win = bet * 2; // Return bet + winnings
        balance += win; 
        vc.writeBalance(balance); 
        appendLog(`Dealer busted. You win $${bet}!`); 
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.dealerBust || 'Nice! Dealer went over 21!'); 
        vc.confetti(40); 
        vc.showBigMessage(`You won $${bet}!`,1400);
        playerWon = true;
      }
      else if(pv === 21 && player.length === 2 && dv !== 21) {
        // Player blackjack (21 with 2 cards) - 3:2 payout
        try{ if(window.vc && typeof window.vc.incrementBlackjackNaturals === 'function') window.vc.incrementBlackjackNaturals(1); }catch(e){}
        const win = Math.floor(bet * 2.5); // 1.5x bet + original bet back
        balance += win;
        vc.writeBalance(balance);
        appendLog(`BLACKJACK! You win $${win - bet}!`);
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.playerBlackjack || 'BLACKJACK! What a hand!');
        vc.confetti(60);
        vc.showBigMessage(`BLACKJACK! +$${win - bet}!`,1600);
        playerWon = true;
      }
      else if(dv === 21 && dealer.length === 2 && pv !== 21) {
        // Dealer blackjack - player loses
        appendLog('Dealer has blackjack - lose.');
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.dealerBlackjack || 'Dealer got blackjack... tough break.');
        vc.showBigMessage('DEALER BLACKJACK',1000);
        playerWon = false;
      }
      else if(pv === dv) {
        // Push (tie) - return bet (don't count as win or loss for stats)
        balance += bet;
        vc.writeBalance(balance);
        appendLog('Push - tie game. Bet returned.');
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.tie || 'It\'s a tie! Your bet is returned.');
        vc.showBigMessage('PUSH - TIE',1000);
        // Don't record push in stats
        hitBtn.disabled = false;
        standBtn.disabled = false;
        return;
      }
      else if(pv > dv) {
        // Player wins - 1:1 payout
        const win = bet * 2; // Return bet + winnings
        balance += win;
        vc.writeBalance(balance);
        appendLog(`You win $${bet}!`);
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.playerWin || 'Great hand! You beat the dealer!');
        vc.confetti(40);
        vc.showBigMessage(`You won $${bet}!`,1400);
        playerWon = true;
      }
      else {
        // Dealer wins
        appendLog('Dealer wins.');
        vc.setBuddyText(window.TODD_DIALOGUE?.blackjack?.dealerWin || 'Dealer had the better hand this time.');
        vc.showBigMessage('YOU LOST',1000);
        playerWon = false;
      }
      
      // Record game result in stats
      recordResult(playerWon);
      
      // Re-enable buttons for next round
      hitBtn.disabled = false;
      standBtn.disabled = false;
    }

    dealBtn && dealBtn.addEventListener('click', deal);
    hitBtn && hitBtn.addEventListener('click', hit);
    standBtn && standBtn.addEventListener('click', stand);
});
