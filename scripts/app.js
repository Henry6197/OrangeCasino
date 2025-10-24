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

  function paybackLoan(){ let balance = readBalance(); let debt = readDebt(); if(debt <= 0){ setBuddyText(window.TODD_DIALOGUE?.loan?.noDebt || 'No debt to pay.'); return; } const pay = Math.min(balance, debt); if(pay <= 0){ setBuddyText(window.TODD_DIALOGUE?.loan?.insufficientFunds || 'Not enough balance to pay debt.'); return; } balance -= pay; debt -= pay; writeBalance(balance); writeDebt(debt); setBuddyText(window.TODD_DIALOGUE?.loan?.thanksPaid || 'Thanks! Debt lowered.'); }

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

  window.vc = { readBalance, writeBalance, updateBalance, readDebt, writeDebt, updateDebt, loan100, paybackLoan, setBuddyText, showBigMessage, confetti, readJackpot, writeJackpot, updateJackpot, addToJackpot, winJackpot };
  document.addEventListener('DOMContentLoaded', ()=>{ 
    vc.updateBalance(); 
    vc.updateDebt(); 
    vc.updateJackpot();
    const brand = document.querySelector('.brand'); 
    if(brand) brand.textContent = 'ORANGE CASINO'; 
    
    // Check debt limit on page load (except on coal mine page)
    if(!window.location.href.includes('coal-mine.html')){
      const debt = readDebt();
      if(debt > 5500){
        window.location.href = 'coal-mine.html';
      }
    }
  });
})();
