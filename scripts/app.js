// Shared utilities: balance handling and small helpers
(()=>{
  function readBalance(){
    const raw = localStorage.getItem('vc_balance');
    return raw ? Number(raw) : 1000;
  }
  function writeBalance(v){ 
    localStorage.setItem('vc_balance', String(v)); 
    updateBalance(); 
    checkAutoPayoffDebt(); 
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

  // Check if debt exceeds $10,000 and force coal mine
  function checkDebtLimit(){
    const debt = readDebt();
    
    if(debt > 10000){
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
    const balance = readBalance();
    const debt = readDebt();
    
    if(debt > 0 && balance >= debt + 500){
      // Auto pay off debt completely
      const newBalance = balance - debt;
      localStorage.setItem('vc_balance', String(newBalance)); // Direct write to avoid recursion
      updateBalance();
      localStorage.setItem('vc_debt', '0'); // Direct write to avoid recursion
      updateDebt();
      
      setBuddyText(window.TODD_DIALOGUE?.loan?.autoPaidOff || `Auto-paid off $${debt} debt! You still have $${newBalance} left.`);
      
      // Show a celebration message
      if(typeof confetti === 'function') confetti(30);
      if(typeof showBigMessage === 'function') showBigMessage(`DEBT CLEARED! -$${debt}`, 2000);
    }
  }

  function loan100(){ // give $100, add $150 debt
    let balance = readBalance(); let debt = readDebt(); balance += 100; debt += 150; writeBalance(balance); writeDebt(debt); setBuddyText(window.TODD_DIALOGUE?.loan?.granted || 'Loan granted — spend wisely.'); }

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

  window.vc = { readBalance, writeBalance, updateBalance, readDebt, writeDebt, updateDebt, loan100, paybackLoan, setBuddyText, showBigMessage, confetti };
  document.addEventListener('DOMContentLoaded', ()=>{ 
    vc.updateBalance(); 
    vc.updateDebt(); 
    const brand = document.querySelector('.brand'); 
    if(brand) brand.textContent = 'ORANGE CASINO'; 
    
    // Check debt limit on page load (except on coal mine page)
    if(!window.location.href.includes('coal-mine.html')){
      const debt = readDebt();
      if(debt > 10000){
        window.location.href = 'coal-mine.html';
      }
    }
  });
})();
