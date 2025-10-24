document.addEventListener('DOMContentLoaded', () => {
  // Scratch-off game state
  let gameState = {
    ticketsBought: 0,
    totalSpent: 0,
    totalWon: 0,
    activeTicket: null,
    lastTicketType: null
  };

  // Ticket definitions with realistic odds
  const ticketTypes = {
    lucky7: {
      name: "Lucky 7s",
      price: 5,
      symbols: ['7️⃣', '🍒', '🍋', '🍊', '🔔', '💎', '⭐', '🎰'],
      winCondition: (symbols) => {
        const sevens = symbols.filter(s => s === '7️⃣').length;
        if (sevens >= 3) return 50;
        if (sevens === 2) return 15;
        if (sevens === 1) return 5; // Money back
        return 0;
      },
      winPatterns: ['7️⃣ 7️⃣ 7️⃣ = $50', '7️⃣ 7️⃣ ? = $15', '7️⃣ ? ? = $5'],
      spots: 3
    },
    goldmine: {
      name: "Gold Mine",
      price: 10,
      symbols: ['🥇', '⛏️', '💰', '🪨', '💎', '🔥', '⭐', '🌟'],
      winCondition: (symbols) => {
        const gold = symbols.filter(s => s === '🥇').length;
        const money = symbols.filter(s => s === '💰').length;
        const gems = symbols.filter(s => s === '💎').length;
        const tools = symbols.filter(s => s === '⛏️').length;
        
        if (gold >= 3) return 500;
        if (money >= 3) return 100;
        if (gems >= 2) return 50;
        if (tools >= 3) return 25;
        if (gold >= 1) return 10; // Money back
        return 0;
      },
      winPatterns: ['🥇 🥇 🥇 = $500', '💰 💰 💰 = $100', '💎 💎 ? = $50', '⛏️ ⛏️ ⛏️ = $25', '🥇 ? ? = $10'],
      spots: 6
    },
    jackpot: {
      name: "Diamond Jackpot",
      price: 25,
      symbols: ['💎', '👑', '💰', '🎰', '🍀', '⭐', '🔥', '⚡'],
      winCondition: (symbols) => {
        const diamonds = symbols.filter(s => s === '💎').length;
        const crowns = symbols.filter(s => s === '👑').length;
        const slots = symbols.filter(s => s === '🎰').length;
        const money = symbols.filter(s => s === '💰').length;
        
        if (diamonds >= 4) return 5000;
        if (crowns >= 3) return 1000;
        if (diamonds >= 3) return 500;
        if (slots >= 3) return 200;
        if (money >= 3) return 100;
        if (diamonds >= 1) return 25; // Money back
        return 0;
      },
      winPatterns: ['💎 💎 💎 💎 = $5000', '👑 👑 👑 = $1000', '💎 💎 💎 = $500', '🎰 🎰 🎰 = $200', '💰 💰 💰 = $100', '💎 ? ? = $25'],
      spots: 9
    },
    millionaire: {
      name: "Millionaire Dreams",
      price: 50,
      symbols: ['💰', '🏆', '💸', '🎯', '⭐', '🔥', '⚡', '💫'],
      winCondition: (symbols) => {
        const money = symbols.filter(s => s === '💰').length;
        const trophy = symbols.filter(s => s === '🏆').length;
        const bills = symbols.filter(s => s === '💸').length;
        const target = symbols.filter(s => s === '🎯').length;
        
        if (money >= 8) return 50000;   // Need 8 money symbols (nearly impossible)
        if (trophy >= 7) return 10000; // Need 7 trophy symbols (extremely hard)
        if (money >= 6) return 2500;   // Need 6 money symbols (very hard)
        if (bills >= 6) return 1000;   // Need 6 bills (very hard) - was 5
        if (target >= 5) return 250;   // Need 5 targets (hard) - was 4
        if (money >= 3) return 50;     // Money back (need 3 instead of 2)
        return 0;
      },
      winPatterns: ['💰 × 8 = $50,000', '🏆 × 7 = $10,000', '💰 × 6 = $2,500', '💸 × 6 = $1,000', '🎯 × 5 = $250', '💰 × 3 = $50'],
      spots: 12
    },
    platinum: {
      name: "Platinum Elite",
      price: 100,
      symbols: ['🔱', '👑', '💎', '⚡', '🌟', '🎆', '💫', '🔥'],
      winCondition: (symbols) => {
        const trident = symbols.filter(s => s === '🔱').length;
        const crown = symbols.filter(s => s === '👑').length;
        const diamond = symbols.filter(s => s === '💎').length;
        const lightning = symbols.filter(s => s === '⚡').length;
        
        if (trident >= 9) return 100000;  // Need 9 tridents (nearly impossible)
        if (crown >= 7) return 25000;    // Need 7 crowns (extremely hard)
        if (diamond >= 6) return 10000;  // Need 6 diamonds (very hard)
        if (trident >= 5) return 5000;   // Need 5 tridents (very hard)
        if (lightning >= 6) return 2000; // Need 6 lightning (very hard)
        if (crown >= 4) return 500;      // Need 4 crowns (hard)
        if (trident >= 3) return 100;    // Money back (need 3 instead of 2)
        return 0;
      },
      winPatterns: ['🔱 × 9 = $100,000', '👑 × 7 = $25,000', '💎 × 6 = $10,000', '🔱 × 5 = $5,000', '⚡ × 6 = $2,000', '👑 × 4 = $500', '🔱 × 3 = $100'],
      spots: 12
    },
    megajackpot: {
      name: "Mega Jackpot Supreme",
      price: 250,
      symbols: ['🎊', '🎉', '🏅', '🏆', '💰', '💸', '🔥', '⭐'],
      winCondition: (symbols) => {
        const confetti = symbols.filter(s => s === '🎊').length;
        const party = symbols.filter(s => s === '🎉').length;
        const medal = symbols.filter(s => s === '🏅').length;
        const trophy = symbols.filter(s => s === '🏆').length;
        const money = symbols.filter(s => s === '💰').length;
        
        if (confetti >= 10) return 1000000; // Need 10 confetti (nearly impossible)
        if (party >= 8) return 100000;      // Need 8 party (extremely hard)
        if (medal >= 7) return 50000;       // Need 7 medals (very hard)
        if (trophy >= 6) return 25000;      // Need 6 trophies (very hard)
        if (confetti >= 5) return 10000;    // Need 5 confetti (very hard)
        if (money >= 5) return 5000;        // Need 5 money (very hard)
        if (party >= 4) return 1000;        // Need 4 party (hard)
        if (confetti >= 3) return 250;      // Money back (need 3 instead of 2)
        return 0;
      },
      winPatterns: ['🎊 × 10 = $1,000,000', '🎉 × 8 = $100,000', '🏅 × 7 = $50,000', '🏆 × 6 = $25,000', '🎊 × 5 = $10,000', '💰 × 5 = $5,000', '🎉 × 4 = $1,000', '🎊 × 3 = $250'],
      spots: 12
    }
  };

  // Load saved stats
  function loadStats() {
    gameState.ticketsBought = parseInt(localStorage.getItem('vc_scratch_tickets_bought') || '0');
    gameState.totalSpent = parseInt(localStorage.getItem('vc_scratch_total_spent') || '0');
    gameState.totalWon = parseInt(localStorage.getItem('vc_scratch_total_won') || '0');
    gameState.lastTicketType = localStorage.getItem('vc_scratch_last_ticket_type') || null;
    updateStatsDisplay();
  }

  // Save stats
  function saveStats() {
    localStorage.setItem('vc_scratch_tickets_bought', gameState.ticketsBought.toString());
    localStorage.setItem('vc_scratch_total_spent', gameState.totalSpent.toString());
    localStorage.setItem('vc_scratch_total_won', gameState.totalWon.toString());
    if (gameState.lastTicketType) {
      localStorage.setItem('vc_scratch_last_ticket_type', gameState.lastTicketType);
    }
  }

  // Reset stats
  function resetStats() {
    if (confirm('Are you sure you want to reset all scratch-off statistics? This cannot be undone.')) {
      gameState.ticketsBought = 0;
      gameState.totalSpent = 0;
      gameState.totalWon = 0;
      gameState.lastTicketType = null;
      
      // Clear localStorage
      localStorage.removeItem('vc_scratch_tickets_bought');
      localStorage.removeItem('vc_scratch_total_spent');
      localStorage.removeItem('vc_scratch_total_won');
      localStorage.removeItem('vc_scratch_last_ticket_type');
      
      // Clear log
      const log = document.getElementById('scratch-log');
      log.innerHTML = '';
      
      updateStatsDisplay();
      vc.setBuddyText('Statistics reset successfully!');
    }
  }

  // Update stats display
  function updateStatsDisplay() {
    document.getElementById('tickets-bought').textContent = gameState.ticketsBought;
    document.getElementById('total-spent').textContent = '$' + gameState.totalSpent.toLocaleString();
    document.getElementById('total-won').textContent = '$' + gameState.totalWon.toLocaleString();
    
    const netProfit = gameState.totalWon - gameState.totalSpent;
    const netElement = document.getElementById('net-profit');
    netElement.textContent = '$' + netProfit.toLocaleString();
    netElement.style.color = netProfit >= 0 ? '#10b981' : '#ef4444';
  }

  // Log scratch result
  function logResult(ticketName, cost, winnings) {
    const log = document.getElementById('scratch-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const profit = winnings - cost;
    const resultClass = winnings > 0 ? 'win' : 'lose';
    
    entry.innerHTML = `
      <span class="ticket-name">${ticketName}</span>
      <span class="result ${resultClass}">
        ${winnings > 0 ? `Won $${winnings}` : 'No win'}
        ${profit !== 0 ? ` (${profit > 0 ? '+' : ''}$${profit})` : ''}
      </span>
    `;
    
    log.prepend(entry);
    
    // Keep only last 10 entries
    while (log.children.length > 10) {
      log.removeChild(log.lastChild);
    }
  }

  // Generate ticket symbols with realistic lottery odds (harder for high stakes)
  function generateTicketSymbols(ticketType) {
    const ticket = ticketTypes[ticketType];
    const symbols = [];
    
    // Define primary winning symbols for money back with different odds per ticket type
    const primaryWinSymbols = {
      lucky7: '7️⃣',
      goldmine: '🥇',
      jackpot: '💎',
      millionaire: '💰',
      platinum: '🔱',
      megajackpot: '🎊'
    };
    
    // Different odds for different ticket types (much more realistic)
    const symbolOdds = {
      lucky7: 0.20,       // 20% chance for primary symbol (1 in 5)
      goldmine: 0.15,     // 15% chance for primary symbol 
      jackpot: 0.12,      // 12% chance for primary symbol
      millionaire: 0.02,  // 2% chance for primary symbol (very hard)
      platinum: 0.015,    // 1.5% chance for primary symbol (extremely hard)
      megajackpot: 0.01   // 1% chance for primary symbol (nearly impossible)
    };
    
    const primarySymbol = primaryWinSymbols[ticketType];
    const probability = symbolOdds[ticketType] || 0.20;
    
    for (let i = 0; i < ticket.spots; i++) {
      let selectedSymbol;
      
      // Use ticket-specific probability for primary winning symbol
      if (Math.random() < probability && primarySymbol) {
        selectedSymbol = primarySymbol;
      } else {
        // Select from non-primary symbols
        const otherSymbols = ticket.symbols.filter(s => s !== primarySymbol);
        selectedSymbol = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
      }
      
      symbols.push(selectedSymbol);
    }
    
    return symbols;
  }

  // Create active ticket with winning patterns
  function createActiveTicket(ticketType, symbols) {
    const ticket = ticketTypes[ticketType];
    const ticketHtml = `
      <div class="winning-patterns">
        <h4>🎯 Winning Patterns</h4>
        <div class="patterns-list">
          ${ticket.winPatterns.map(pattern => `
            <div class="pattern-item">${pattern}</div>
          `).join('')}
        </div>
      </div>
      <div class="scratch-ticket ${ticketType}-active">
        <div class="ticket-header">
          <h4>${ticket.name}</h4>
          <div class="ticket-price">$${ticket.price}</div>
        </div>
        <div class="ticket-body">
          <div class="scratch-grid">
            ${symbols.map((symbol, index) => `
              <div class="scratch-spot" data-index="${index}" data-symbol="${symbol}">
                <div class="scratch-surface">
                  <div class="scratch-overlay">?</div>
                </div>
                <div class="revealed-symbol">${symbol}</div>
              </div>
            `).join('')}
          </div>
          <div class="win-display" id="win-display" style="display: none;">
            <div class="win-amount"></div>
          </div>
        </div>
      </div>
    `;
    
    return ticketHtml;
  }

  // Buy ticket
  function buyTicket(ticketType) {
    const ticket = ticketTypes[ticketType];
    const balance = vc.readBalance();
    
    if (balance < ticket.price) {
      vc.setBuddyText('Not enough money for that ticket!');
      return;
    }
    
    // Deduct cost
    vc.writeBalance(balance - ticket.price);
    
    // Update stats and store last ticket type
    gameState.ticketsBought++;
    gameState.totalSpent += ticket.price;
    gameState.lastTicketType = ticketType;
    saveStats();
    updateStatsDisplay();
    
    // Generate ticket
    const symbols = generateTicketSymbols(ticketType);
    gameState.activeTicket = {
      type: ticketType,
      symbols: symbols,
      scratched: new Array(symbols.length).fill(false),
      revealed: false
    };
    
    // Show active ticket
    const activeArea = document.getElementById('active-ticket-area');
    const activeTicket = document.getElementById('active-ticket');
    activeTicket.innerHTML = createActiveTicket(ticketType, symbols);
    activeArea.style.display = 'block';
    
    // Add scratch event listeners
    addScratchListeners();
    
    // Update the buy again button text
    updateBuyAgainButton();
    
    vc.setBuddyText(`Bought ${ticket.name} ticket! Good luck scratching!`);
    logResult(ticket.name, ticket.price, 0); // Log purchase
  }

  // Add scratch event listeners
  function addScratchListeners() {
    const spots = document.querySelectorAll('.scratch-spot');
    spots.forEach(spot => {
      spot.addEventListener('click', () => scratchSpot(spot));
    });
  }

  // Scratch individual spot with flip animation
  function scratchSpot(spot) {
    if (spot.classList.contains('scratched')) return;
    
    const index = parseInt(spot.dataset.index);
    
    // Add flip animation
    spot.classList.add('flipping');
    
    setTimeout(() => {
      spot.classList.add('scratched');
      spot.classList.remove('flipping');
      gameState.activeTicket.scratched[index] = true;
      
      // Check if all scratched
      if (gameState.activeTicket.scratched.every(s => s)) {
        setTimeout(() => revealResult(), 500);
      }
    }, 300); // Flip animation duration
  }

  // Scratch all spots with staggered animation
  function scratchAll() {
    if (!gameState.activeTicket) return;
    
    const spots = document.querySelectorAll('.scratch-spot:not(.scratched)');
    
    spots.forEach((spot, index) => {
      setTimeout(() => {
        if (!spot.classList.contains('scratched')) {
          const spotIndex = parseInt(spot.dataset.index);
          spot.classList.add('flipping');
          
          setTimeout(() => {
            spot.classList.add('scratched');
            spot.classList.remove('flipping');
            gameState.activeTicket.scratched[spotIndex] = true;
            
            // Check if this is the last spot
            if (gameState.activeTicket.scratched.every(s => s)) {
              setTimeout(() => revealResult(), 300);
            }
          }, 300);
        }
      }, index * 100); // Stagger the animations
    });
  }

  // Reveal result
  function revealResult() {
    if (gameState.activeTicket.revealed) return;
    
    const ticket = ticketTypes[gameState.activeTicket.type];
    const winnings = ticket.winCondition(gameState.activeTicket.symbols);
    
    gameState.activeTicket.revealed = true;
    
    const winDisplay = document.getElementById('win-display');
    const winAmount = winDisplay.querySelector('.win-amount');
    
    if (winnings > 0) {
      // Winner!
      winAmount.textContent = `🎉 You won $${winnings}! 🎉`;
      winDisplay.className = 'win-display winner';
      winDisplay.style.display = 'block';
      
      // Add to balance
      const balance = vc.readBalance();
      vc.writeBalance(balance + winnings);
      
      // Update stats
      gameState.totalWon += winnings;
      saveStats();
      updateStatsDisplay();
      
      // Celebration
      vc.confetti(50);
      vc.showBigMessage(`Won $${winnings}!`, 2000);
      vc.setBuddyText(`Congratulations! You won $${winnings}!`);
      
      // Update log
      const lastEntry = document.querySelector('#scratch-log .log-entry');
      if (lastEntry) {
        const resultSpan = lastEntry.querySelector('.result');
        resultSpan.className = 'result win';
        resultSpan.textContent = `Won $${winnings} (+$${winnings - ticket.price})`;
      }
    } else {
      // No win
      winAmount.textContent = 'No winning combination. Better luck next time!';
      winDisplay.className = 'win-display loser';
      winDisplay.style.display = 'block';
      
      vc.setBuddyText('No win this time. Try another ticket!');
    }
    
    saveStats();
    updateStatsDisplay();
  }

  // Show ticket selection
  function showTicketSelection() {
    document.getElementById('active-ticket-area').style.display = 'none';
    gameState.activeTicket = null;
  }

  // Auto-buy same ticket type
  function buySameTicket() {
    if (gameState.lastTicketType) {
      buyTicket(gameState.lastTicketType);
    } else {
      showTicketSelection();
    }
  }

  // Update buy again button text
  function updateBuyAgainButton() {
    const btn = document.getElementById('new-ticket-btn');
    if (gameState.lastTicketType && ticketTypes[gameState.lastTicketType]) {
      const ticket = ticketTypes[gameState.lastTicketType];
      btn.textContent = `Buy ${ticket.name} Again - $${ticket.price}`;
    } else {
      btn.textContent = 'Buy Another Ticket';
    }
  }

  // Event listeners
  document.querySelectorAll('.buy-ticket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ticketType = btn.dataset.ticket;
      buyTicket(ticketType);
    });
  });

  document.getElementById('scratch-all-btn').addEventListener('click', scratchAll);
  document.getElementById('new-ticket-btn').addEventListener('click', buySameTicket);
  document.getElementById('reset-stats-btn').addEventListener('click', resetStats);

  // Initialize
  loadStats();
  updateBuyAgainButton();
});