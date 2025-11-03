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
        
        let totalWin = 0;
        if (gold >= 3) totalWin += 500;
        else if (gold >= 1) totalWin += 10; // Money back only if no big gold win
        
        if (money >= 3) totalWin += 100;
        if (gems >= 2) totalWin += 50;
        if (tools >= 3) totalWin += 25;
        
        return totalWin;
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
        
        let totalWin = 0;
        if (diamonds >= 4) totalWin += 5000;
        else if (diamonds >= 3) totalWin += 500;
        else if (diamonds >= 1) totalWin += 25; // Money back only if no big diamond win
        
        if (crowns >= 3) totalWin += 1000;
        if (slots >= 3) totalWin += 200;
        if (money >= 3) totalWin += 100;
        
        return totalWin;
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

  // Generate ticket symbols with realistic lottery odds
  function generateTicketSymbols(ticketType) {
    const ticket = ticketTypes[ticketType];
    const symbols = [];
    
    // Define primary winning symbols and their realistic odds
    const winningConfig = {
      lucky7: {
        primary: '7️⃣',
        odds: {
          jackpot: 0.001,    // 0.1% chance for 3+ sevens (1 in 1000)
          small: 0.08,       // 8% chance for 1-2 sevens (1 in 12.5)
          none: 0.919        // 91.9% chance for no win
        }
      },
      goldmine: {
        primary: '🥇',
        odds: {
          jackpot: 0.0005,   // 0.05% chance for big win (1 in 2000)
          medium: 0.002,     // 0.2% chance for medium win
          small: 0.05,       // 5% chance for small win (1 in 20)
          none: 0.9475       // 94.75% chance for no win
        }
      },
      jackpot: {
        primary: '�',
        odds: {
          mega: 0.0001,      // 0.01% chance for mega jackpot (1 in 10,000)
          large: 0.0002,     // 0.02% chance for large win
          medium: 0.001,     // 0.1% chance for medium win
          small: 0.03,       // 3% chance for small win (1 in 33)
          none: 0.9687       // 96.87% chance for no win
        }
      },
      millionaire: {
        primary: '💰',
        odds: {
          mega: 0.00002,     // 0.002% chance for mega win (1 in 50,000)
          large: 0.00005,    // 0.005% chance for large win
          medium: 0.0002,    // 0.02% chance for medium win
          small: 0.015,      // 1.5% chance for small win (1 in 67)
          none: 0.98473      // 98.473% chance for no win
        }
      },
      platinum: {
        primary: '🔱',
        odds: {
          mega: 0.000001,    // 0.0001% chance for mega win (1 in 1,000,000)
          large: 0.000004,   // 0.0004% chance for large win
          medium: 0.00002,   // 0.002% chance for medium win
          small: 0.008,      // 0.8% chance for small win (1 in 125)
          none: 0.991975     // 99.1975% chance for no win
        }
      },
      megajackpot: {
        primary: '🎊',
        odds: {
          million: 0.005, // 0.5% chance for million (1 in 200)
          mega: 0.03,    // 0.03% chance for mega win
          large: 0.05,   // 0.05% chance for large win
          medium: 0.07,   // 7% chance for medium win
          small: 0.2,      // 20% chance for small win (1 in 5)
          none: 0.7         // 70% chance for no win
        }
      }
    };
    
    const config = winningConfig[ticketType];
    if (!config) return symbols;
    
    // Determine win level based on realistic odds
    const random = Math.random();
    let winLevel = 'none';
    let cumulative = 0;
    
    for (const [level, probability] of Object.entries(config.odds)) {
      cumulative += probability;
      if (random <= cumulative) {
        winLevel = level;
        break;
      }
    }
    
    // Generate symbols based on win level
    const primarySymbol = config.primary;
    const otherSymbols = ticket.symbols.filter(s => s !== primarySymbol);
    
    // Calculate how many primary symbols needed for this win level
    let primaryCount = 0;
    if (ticketType === 'lucky7') {
      if (winLevel === 'jackpot') primaryCount = 3;
      else if (winLevel === 'small') primaryCount = Math.random() < 0.5 ? 1 : 2;
    } else if (ticketType === 'goldmine') {
      if (winLevel === 'jackpot') primaryCount = 3;
      else if (winLevel === 'medium') primaryCount = Math.random() < 0.3 ? 2 : 3; // Mix of conditions
      else if (winLevel === 'small') primaryCount = 1;
    } else if (ticketType === 'jackpot') {
      if (winLevel === 'mega') primaryCount = 4;
      else if (winLevel === 'large') primaryCount = 3;
      else if (winLevel === 'medium') primaryCount = 3; // Different combinations
      else if (winLevel === 'small') primaryCount = 1;
    } else if (ticketType === 'millionaire') {
      if (winLevel === 'mega') primaryCount = 8;
      else if (winLevel === 'large') primaryCount = 7; // Trophy symbols
      else if (winLevel === 'medium') primaryCount = 6;
      else if (winLevel === 'small') primaryCount = 3;
    } else if (ticketType === 'platinum') {
      if (winLevel === 'mega') primaryCount = 9;
      else if (winLevel === 'large') primaryCount = 7; // Crown symbols
      else if (winLevel === 'medium') primaryCount = 6; // Diamond or 5 tridents
      else if (winLevel === 'small') primaryCount = 3;
    } else if (ticketType === 'megajackpot') {
      if (winLevel === 'million') primaryCount = 10;
      else if (winLevel === 'mega') primaryCount = 8; // Party symbols
      else if (winLevel === 'large') primaryCount = 7; // Medal symbols
      else if (winLevel === 'medium') primaryCount = 6; // Trophy symbols
      else if (winLevel === 'small') primaryCount = 3;
    }
    
    // Place primary symbols randomly
    const positions = Array.from({length: ticket.spots}, (_, i) => i);
    for (let i = 0; i < primaryCount; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      const position = positions.splice(randomIndex, 1)[0];
      symbols[position] = primarySymbol;
    }
    
    // Fill remaining positions with other symbols
    positions.forEach(pos => {
      // Add some variety with other winning symbols occasionally
      let symbol;
      if (Math.random() < 0.1) {
        // 10% chance for secondary symbols that might create smaller wins
        const secondaryWinSymbols = ticket.symbols.filter(s => 
          s !== primarySymbol && ['👑', '💰', '💎', '🏆', '🏅', '🎉'].includes(s)
        );
        symbol = secondaryWinSymbols.length > 0 ? 
          secondaryWinSymbols[Math.floor(Math.random() * secondaryWinSymbols.length)] :
          otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
      } else {
        symbol = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
      }
      symbols[pos] = symbol;
    });
    
    // Fill any remaining empty positions
    for (let i = 0; i < ticket.spots; i++) {
      if (!symbols[i]) {
        symbols[i] = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
      }
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
          <div class="scratch-area-container">
            <div class="scratch-grid">
              ${symbols.map((symbol, index) => `
                <div class="scratch-spot" data-index="${index}" data-symbol="${symbol}">
                  <div class="revealed-symbol">${symbol}</div>
                </div>
              `).join('')}
            </div>
            <canvas class="scratch-canvas" width="600" height="400"></canvas>
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

  // Add scratch event listeners with drag functionality
  function addScratchListeners() {
    const canvas = document.querySelector('.scratch-canvas');
    const ctx = canvas.getContext('2d');
    const spots = document.querySelectorAll('.scratch-spot');
    
    if (!canvas) return;
    
    // Initialize scratch surface
    initializeScratchSurface(canvas, ctx);
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Mouse events
    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', endScratch);
    canvas.addEventListener('mouseleave', endScratch);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', endScratch);
    
    function startScratch(e) {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      lastX = (e.clientX - rect.left) * scaleX;
      lastY = (e.clientY - rect.top) * scaleY;
      scratchAt(ctx, lastX, lastY);
      checkAllSpotsProgress(canvas, ctx, spots);
    }
    
    function scratch(e) {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;
      
      // Draw a line from last position to current position for smoother scratching
      scratchLine(ctx, lastX, lastY, currentX, currentY);
      
      lastX = currentX;
      lastY = currentY;
      
      checkAllSpotsProgress(canvas, ctx, spots);
    }
    
    function endScratch() {
      isDrawing = false;
    }
    
    function handleTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      isDrawing = true;
      lastX = (touch.clientX - rect.left) * scaleX;
      lastY = (touch.clientY - rect.top) * scaleY;
      scratchAt(ctx, lastX, lastY);
      checkAllSpotsProgress(canvas, ctx, spots);
    }
    
    function handleTouchMove(e) {
      e.preventDefault();
      if (!isDrawing) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const currentX = (touch.clientX - rect.left) * scaleX;
      const currentY = (touch.clientY - rect.top) * scaleY;
      
      scratchLine(ctx, lastX, lastY, currentX, currentY);
      
      lastX = currentX;
      lastY = currentY;
      
      checkAllSpotsProgress(canvas, ctx, spots);
    }
  }

  // Initialize the scratch surface coating
  function initializeScratchSurface(canvas, ctx) {
    // Clear canvas and reset composite operation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    
    // Create metallic silver gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e5e7eb');
    gradient.addColorStop(0.25, '#d1d5db');
    gradient.addColorStop(0.5, '#9ca3af');
    gradient.addColorStop(0.75, '#6b7280');
    gradient.addColorStop(1, '#4b5563');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add metallic texture pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add diagonal scratches for texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, 0);
      ctx.lineTo(Math.random() * canvas.width, canvas.height);
      ctx.stroke();
    }
    
    // Add "SCRATCH OFF" text in multiple places
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH OFF', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillText('TO REVEAL PRIZES', canvas.width / 2, canvas.height / 2 + 10);
    
    // Add corner text
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SCRATCH HERE', 20, 30);
    ctx.textAlign = 'right';
    ctx.fillText('SCRATCH HERE', canvas.width - 20, canvas.height - 20);
  }

  // Scratch at specific coordinates
  function scratchAt(ctx, x, y) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  // Draw a scratch line between two points
  function scratchLine(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // Check how much has been scratched for each spot
  function checkAllSpotsProgress(canvas, ctx, spots) {
    spots.forEach((spot, index) => {
      if (gameState.activeTicket.scratched[index]) return;
      
      const spotRect = spot.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calculate spot position relative to canvas
      const spotX = ((spotRect.left - canvasRect.left) / canvasRect.width) * canvas.width;
      const spotY = ((spotRect.top - canvasRect.top) / canvasRect.height) * canvas.height;
      const spotWidth = (spotRect.width / canvasRect.width) * canvas.width;
      const spotHeight = (spotRect.height / canvasRect.height) * canvas.height;
      
      // Check if this spot area has been scratched enough
      const imageData = ctx.getImageData(spotX, spotY, spotWidth, spotHeight);
      const pixels = imageData.data;
      let transparentPixels = 0;
      
      // Count transparent pixels (alpha = 0) in this spot
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparentPixels++;
      }
      
      const spotPixels = spotWidth * spotHeight;
      const scratchPercentage = transparentPixels / spotPixels;
      
      // If 15% or more is scratched, completely clear this spot area
      if (scratchPercentage >= 0.15) {
        clearSpotArea(ctx, spotX, spotY, spotWidth, spotHeight);
        revealSpot(index);
      }
    });
  }

  // Completely clear a spot area
  function clearSpotArea(ctx, x, y, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  // Reveal individual spot
  function revealSpot(index) {
    if (gameState.activeTicket.scratched[index]) return;
    
    const spot = document.querySelector(`.scratch-spot[data-index="${index}"]`);
    if (!spot) return;
    
    gameState.activeTicket.scratched[index] = true;
    
    // Add reveal animation to the symbol
    const symbol = spot.querySelector('.revealed-symbol');
    if (symbol) {
      symbol.style.animation = 'revealSymbol 0.5s ease-out';
      symbol.classList.add('revealed');
    }
    
    // Check if all spots are scratched
    if (gameState.activeTicket.scratched.every(s => s)) {
      setTimeout(() => revealResult(), 500);
    }
  }

  // Scratch all spots with staggered animation
  function scratchAll() {
    if (!gameState.activeTicket) return;
    
    const canvas = document.querySelector('.scratch-canvas');
    const ctx = canvas.getContext('2d');
    const spots = document.querySelectorAll('.scratch-spot');
    
    // Completely clear the canvas with animation
    let clearProgress = 0;
    const clearAnimation = setInterval(() => {
      clearProgress += 0.05;
      
      // Clear canvas in expanding circles
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgba(0,0,0,1)';
      const radius = (canvas.width * clearProgress) / 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      
      if (clearProgress >= 1) {
        clearInterval(clearAnimation);
        // Clear entire canvas to be sure
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 50);
    
    // Reveal spots with staggered timing
    spots.forEach((spot, index) => {
      const spotIndex = parseInt(spot.dataset.index);
      if (gameState.activeTicket.scratched[spotIndex]) return;
      
      setTimeout(() => {
        revealSpot(spotIndex);
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