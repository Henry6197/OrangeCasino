document.addEventListener('DOMContentLoaded', ()=>{
  const TIMER_KEY = 'vc_surgery_done';
  const usedKey = 'vc_surgery_used';
  const log = document.getElementById('surgery-log');
  const timerEl = document.getElementById('timer');

  function append(s){ if(!log) return; const p=document.createElement('div'); p.textContent=s; log.prepend(p); }

  // If already used, show message
  let uses = Number(localStorage.getItem('vc_surgery_uses') || 0);
  const used = localStorage.getItem(usedKey);
  if(used && uses >= 1){ append('You have already sold a kidney. This is a one-time action unless you have a code.'); timerEl.textContent = 'DONE'; }

  // Ghost codes now handled in surgery.html script section

  // navigation lock utilities
  let navHandlers = [];
  function lockNavigation(){
    // Allow leaving but redirect back if surgery not complete
    window.addEventListener('beforeunload', beforeUnloadHandler);
    
    // Check if user returns to page during surgery
    document.addEventListener('visibilitychange', function() {
      const finishAt = Number(localStorage.getItem(TIMER_KEY) || 0);
      const now = Date.now();
      if (document.visibilityState === 'visible' && finishAt > now) {
        setTimeout(function() {
          if (window.location.pathname.includes('surgery.html')) {
            append('You cannot leave during surgery - redirected back!');
            vc.setBuddyText('Surgery must be completed!');
          }
        }, 100);
      }
    });
  }
  function unlockNavigation(){
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    navHandlers.forEach(o=> o.el.removeEventListener('click', o.handler));
    navHandlers = [];
  }
  function beforeUnloadHandler(e){ 
    const finishAt = Number(localStorage.getItem(TIMER_KEY) || 0);
    const now = Date.now();
    if (finishAt > now) {
      // Surgery in progress - allow leaving but set up redirect
      setTimeout(function() {
        if (finishAt > Date.now()) {
          window.location.href = 'surgery.html';
        }
      }, 1000);
    }
  }

  // If timer previously set, check completion
  const finishAt = Number(localStorage.getItem(TIMER_KEY) || 0);
  const start = Date.now();
  let target = finishAt && finishAt > start ? finishAt : (Date.now() + 30*1000);
  localStorage.setItem(TIMER_KEY, String(target));

  append('Lying down... surgery started. Please wait.');
  // lock navigation while waiting
  lockNavigation();

  const iv = setInterval(()=>{
    const now = Date.now();
    const remain = Math.max(0, target - now);
    const mm = String(Math.floor(remain/60000)).padStart(2,'0');
    const ss = String(Math.floor((remain%60000)/1000)).padStart(2,'0');
    timerEl.textContent = `${mm}:${ss}`;
    if(remain <= 0){
      clearInterval(iv);
      timerEl.textContent = '00:00';
      // pay user 5,000 once
      const balance = vc.readBalance(); vc.writeBalance(balance + 5000);
      localStorage.setItem(usedKey, '1');
      localStorage.removeItem(TIMER_KEY);
      
      // Mark achievement for selling kidney
      try{ if(window.vc && typeof window.vc.markSurgeryUsed === 'function') window.vc.markSurgeryUsed(); }catch(e){}
      
      append('Surgery complete. You received $5,000.');
      vc.setBuddyText(window.generateRandomRamble ? window.generateRandomRamble() : 'Tremendous money, really tremendous.');
      vc.showBigMessage('Surgery complete! $5,000', 2000);
      // unlock navigation now surgery is done
      unlockNavigation();
    }
  }, 500);

});
