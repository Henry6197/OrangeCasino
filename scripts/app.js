// Shared utilities: balance handling and small helpers
(()=>{
  // Auto payoff protection flag
  let autoPayoffInProgress = false;
  
  function readBalance(){
    const raw = localStorage.getItem('vc_balance');
    return raw ? Number(raw) : 1000;
  }
  function writeBalance(v){ 
    localStorage.setItem('vc_balance', String(v)); 
    updateBalance(); 
    // Only trigger auto-payoff if not already in progress
    if(!autoPayoffInProgress) {
      checkAutoPayoffDebt(); 
    }
  }
  
  function updateBalance(){ const els = document.querySelectorAll('#balance-value'); els.forEach(e=>{ const v = readBalance(); e.textContent = String(v); }); }

  // Debt handling
  function readDebt(){ const raw = localStorage.getItem('vc_debt'); return raw ? Number(raw) : 0; }
  function writeDebt(v){ 
    localStorage.setItem('vc_debt', String(v)); 
    updateDebt(); 
    checkDebtLimit();
  }
  
  function updateDebt(){ const els = document.querySelectorAll('#debt-value'); els.forEach(e=>{ const v = readDebt(); e.textContent = String(v); }); }

  // Progressive Jackpot system
  function readJackpot(){ const raw = localStorage.getItem('vc_jackpot'); return raw ? Number(raw) : 5000; }
  function writeJackpot(v){ 
    localStorage.setItem('vc_jackpot', String(v)); 
    updateJackpot(); 
  }
  function updateJackpot(){ const els = document.querySelectorAll('#jackpot-amount'); els.forEach(e=>{ const v = readJackpot(); e.textContent = String(v.toLocaleString()); }); }
  
  function addToJackpot(betAmount) {
    const contribution = Math.floor(betAmount * 0.1); // 10% of bet goes to jackpot
    const currentJackpot = readJackpot();
    writeJackpot(currentJackpot + contribution);
    return contribution;
  }
  
  function winJackpot() {
    const jackpotAmount = readJackpot();
    const balance = readBalance();
    writeBalance(balance + jackpotAmount);
    writeJackpot(5000); // Reset to base amount
    return jackpotAmount;
  }

  // Check if debt exceeds $5,500 and force coal mine
  function checkDebtLimit(){
    const debt = readDebt();
    
    if(debt > 5500){
      // Mark coal mine visited for achievement
      if(window.vc && typeof window.vc.markCoalMineVisited === 'function'){
        window.vc.markCoalMineVisited();
      }
      
      // Force redirect to coal mine (can happen multiple times)
      setTimeout(() => {
        window.location.href = 'coal-mine.html';
      }, 1000); // Small delay to show the debt first
    }
  }

  // Auto payoff debt when balance is high enough
  function checkAutoPayoffDebt(){
    if(autoPayoffInProgress) return; // Prevent recursion
    
    const balance = readBalance();
    const debt = readDebt();
    
    if(debt > 0 && balance >= debt + 100){ // Reduced threshold from 500 to 100
      autoPayoffInProgress = true;
      
      try {
        // Auto pay off debt completely
        const newBalance = balance - debt;
        
        // Ensure both operations complete successfully
        localStorage.setItem('vc_balance', String(newBalance));
        localStorage.setItem('vc_debt', '0');
        
        // Force update both displays
        updateBalance();
        updateDebt();
        
        setBuddyText(window.TODD_DIALOGUE?.loan?.autoPaidOff || `Auto-paid off $${debt} debt! You still have $${newBalance} left.`);
        
        // Show a celebration message
        if(typeof vc.confetti === 'function') vc.confetti(30);
        if(typeof vc.showBigMessage === 'function') vc.showBigMessage(`DEBT CLEARED! -$${debt}`, 2000);
        
      } catch(error) {
        // If something goes wrong, restore the original balance
        console.error('Auto debt payoff failed:', error);
        localStorage.setItem('vc_balance', String(balance));
        updateBalance();
      } finally {
        autoPayoffInProgress = false;
      }
    } else {
      autoPayoffInProgress = false;
    }
  }

  function loan100(){ // give $100, add $150 debt
    let balance = readBalance(); 
    let debt = readDebt(); 
    
    // Removed loan limit - can always take loans regardless of balance
    
    balance += 100; 
    debt += 150; 
    writeBalance(balance); 
    writeDebt(debt); 
    setBuddyText(window.TODD_DIALOGUE?.loan?.granted || 'Loan granted — spend wisely.'); 
  }

  function paybackLoan(){ 
    let balance = readBalance(); 
    let debt = readDebt(); 
    if(debt <= 0){ 
      setBuddyText(window.TODD_DIALOGUE?.loan?.noDebt || 'No debt to pay.'); 
      return; 
    } 
    const pay = Math.min(balance, debt); 
    if(pay <= 0){ 
      setBuddyText(window.TODD_DIALOGUE?.loan?.insufficientFunds || 'Not enough balance to pay debt.'); 
      return; 
    } 
    balance -= pay; 
    debt -= pay; 
    writeBalance(balance); 
    writeDebt(debt); 
    
    // Stop global blood debt timer if debt is fully paid
    if (debt === 0) {
      stopGlobalBloodDebtTimer();
      setBuddyText('Smart move! Debt paid in full. You avoided the surgery table.');
    } else {
      setBuddyText(window.TODD_DIALOGUE?.loan?.thanksPaid || 'Thanks! Debt lowered.'); 
    }
  }

  // Buddy and overlay helpers
  function setBuddyText(s){ const b = document.getElementById('buddy-text'); if(b) b.textContent = s; }
  function showBigMessage(text, ms=1000){ const ov = document.getElementById('big-overlay'); const msg = document.getElementById('big-message'); if(!ov||!msg) return; msg.textContent = text; ov.classList.add('show'); setTimeout(()=> ov.classList.remove('show'), ms); }

  // Confetti: spawn simple colored divs and animate down
  function confetti(amount=40){
    const root = document.getElementById('confetti-root');
    if(!root) return;
    for(let i=0;i<amount;i++){
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = (Math.random()*100) + '%';
      el.style.background = (Math.random()>0.5? 'var(--accent)':'#ffd966');
      el.style.opacity = '1';
      el.style.transform = `translateY(-20px) rotate(${Math.random()*360}deg)`;
      root.appendChild(el);
      setTimeout(()=>{
        el.style.transition='transform 1200ms linear, opacity 1200ms linear';
        el.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random()*720}deg)`;
        el.style.opacity='0';
      }, 20);
      setTimeout(()=> root.removeChild(el), 1400);
    }
  }

  // Global blood debt timer functionality
  let globalBloodDebtTimer = null;
  let globalTimeRemaining = 300; // 5 minutes
  
  function startGlobalBloodDebtTimer() {
    if (globalBloodDebtTimer) return; // Don't start if already running
    
    // Create blood debt timer element if it doesn't exist
    let timerElement = document.getElementById('global-blood-debt-timer');
    if (!timerElement) {
      timerElement = document.createElement('div');
      timerElement.id = 'global-blood-debt-timer';
      timerElement.innerHTML = `
        <div style="position: fixed; top: 10px; left: 50%; transform: translateX(-50%); 
                    background: rgba(255, 0, 0, 0.9); border: 2px solid #ff0000; 
                    color: white; padding: 10px 20px; border-radius: 10px; 
                    z-index: 10000; text-align: center; font-weight: bold;
                    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
                    animation: dangerPulse 2s infinite;">
          <div style="font-size: 0.9em;">🩸 BLOOD DEBT COUNTDOWN 🩸</div>
          <div id="global-timer-display" style="font-size: 1.5em; font-family: 'Courier New', monospace;">05:00</div>
          <div style="font-size: 0.8em;">Pay your debt or face surgery!</div>
        </div>
      `;
      document.body.appendChild(timerElement);
    }
    
    timerElement.style.display = 'block';
    globalTimeRemaining = 300; // Reset to 5 minutes
    
    globalBloodDebtTimer = setInterval(() => {
      globalTimeRemaining--;
      
      const minutes = Math.floor(globalTimeRemaining / 60);
      const seconds = globalTimeRemaining % 60;
      const displayElement = document.getElementById('global-timer-display');
      if (displayElement) {
        displayElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (globalTimeRemaining <= 0) {
        clearInterval(globalBloodDebtTimer);
        globalBloodDebtTimer = null;
        
        // Trigger surgery consequences
        localStorage.setItem('vc_robot_legs', 'true');
        localStorage.removeItem('vc_last_blood_loan');
        
        if (timerElement) {
          timerElement.style.display = 'none';
        }
        
        if (typeof setBuddyText === 'function') {
          setBuddyText("Time's up! Your legs are now robot wheels. Hope you like the upgrade.");
        }
        
        // Redirect to underground if not already there
        if (!window.location.href.includes('underground')) {
          window.location.href = 'underground.html';
        }
      }
    }, 1000);
  }
  
  function stopGlobalBloodDebtTimer() {
    if (globalBloodDebtTimer) {
      clearInterval(globalBloodDebtTimer);
      globalBloodDebtTimer = null;
    }
    
    const timerElement = document.getElementById('global-blood-debt-timer');
    if (timerElement) {
      timerElement.style.display = 'none';
    }
    
    localStorage.removeItem('vc_last_blood_loan');
  }
  
  // Global organ effects system
  function applyGlobalOrganEffects() {
    const soldOrgans = JSON.parse(localStorage.getItem('vc_sold_organs') || '[]');
    
    // Apply visual effects based on sold organs
    soldOrgans.forEach(organ => {
      switch(organ) {
        case 'eye':
          document.body.style.filter += ' blur(1px)';
          break;
        case 'liver':
          // Alcohol effects - slight color distortion
          document.body.style.filter += ' saturate(0.7)';
          break;
        case 'lung':
          // Breathing issues - slight shake effect
          document.body.style.animation = 'shake 3s infinite';
          break;
        case 'kidney':
          // Functional effect tracked in localStorage
          localStorage.setItem('vc_kidney_sold', 'true');
          break;
        case 'finger':
          // Functional effect tracked in localStorage
          localStorage.setItem('vc_finger_sold', 'true');
          break;
        // Tooth and hair are aesthetic only, no permanent visual effects
      }
    });
  }
  
  // Function to add organ effect (called when organ is sold)
  function addOrganEffect(organ) {
    const soldOrgans = JSON.parse(localStorage.getItem('vc_sold_organs') || '[]');
    if (!soldOrgans.includes(organ)) {
      soldOrgans.push(organ);
      localStorage.setItem('vc_sold_organs', JSON.stringify(soldOrgans));
    }
    
    // Apply the effect immediately
    switch(organ) {
      case 'eye':
        document.body.style.filter += ' blur(1px)';
        break;
      case 'liver':
        document.body.style.filter += ' saturate(0.7)';
        break;
      case 'lung':
        document.body.style.animation = 'shake 3s infinite';
        break;
      case 'kidney':
        localStorage.setItem('vc_kidney_sold', 'true');
        break;
      case 'finger':
        localStorage.setItem('vc_finger_sold', 'true');
        break;
    }
  }
  
  // Function to reset all organ effects (for the "free" code)
  function resetAllOrganEffects() {
    localStorage.removeItem('vc_sold_organs');
    localStorage.removeItem('vc_kidney_sold');
    localStorage.removeItem('vc_finger_sold');
    
    // Reset visual effects
    const currentFilter = document.body.style.filter;
    document.body.style.filter = currentFilter
      .replace(/blur\([^)]*\)/g, '')
      .replace(/saturate\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    document.body.style.animation = '';
  }

  // Todd scrolling functionality
  function initToddScrolling() {
    const buddy = document.getElementById('buddy');
    if (!buddy) return;
    
    let ticking = false;
    
    function updateToddPosition() {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate Todd's position based on scroll percentage
      const scrollPercent = scrollY / (documentHeight - windowHeight);
      const maxMovement = 50; // Maximum pixels Todd can move
      const movement = Math.sin(scrollPercent * Math.PI * 2) * maxMovement;
      
      buddy.style.transform = `translateY(${movement}px)`;
      buddy.style.transition = 'transform 0.3s ease-out';
      
      ticking = false;
    }
    
    function requestToddUpdate() {
      if (!ticking) {
        requestAnimationFrame(updateToddPosition);
        ticking = true;
      }
    }
    
    window.addEventListener('scroll', requestToddUpdate);
  }
  
  // Fix background color changes on scroll
  function fixBackgroundScroll() {
    document.documentElement.style.background = 'inherit';
    document.body.style.backgroundAttachment = 'fixed';
  }

  window.vc = { readBalance, writeBalance, updateBalance, readDebt, writeDebt, updateDebt, loan100, paybackLoan, setBuddyText, showBigMessage, confetti, readJackpot, writeJackpot, updateJackpot, addToJackpot, winJackpot, startGlobalBloodDebtTimer, stopGlobalBloodDebtTimer, addOrganEffect, resetAllOrganEffects };
  document.addEventListener('DOMContentLoaded', ()=>{ 
    vc.updateBalance(); 
    vc.updateDebt(); 
    vc.updateJackpot();
    const brand = document.querySelector('.brand'); 
    if(brand) brand.textContent = 'ORANGE CASINO'; 
    
    // Apply any existing organ effects globally on every page
    applyGlobalOrganEffects();
    
    // Initialize Todd scrolling and background fix
    initToddScrolling();
    fixBackgroundScroll();
    
    // Check for active blood debt timer
    const lastLoanTime = localStorage.getItem('vc_last_blood_loan');
    if (lastLoanTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastLoanTime)) / 1000);
      globalTimeRemaining = Math.max(0, 300 - elapsed);
      if (globalTimeRemaining > 0) {
        startGlobalBloodDebtTimer();
      } else {
        localStorage.removeItem('vc_last_blood_loan');
      }
    }
    
    // Check debt limit on page load (except on coal mine page)
    if(!window.location.href.includes('coal-mine.html')){
      const debt = readDebt();
      if(debt > 5500){
        window.location.href = 'coal-mine.html';
      }
    }
  });
})();
