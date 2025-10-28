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
    // beforeunload prompt
    window.addEventListener('beforeunload', beforeUnloadHandler);
    // intercept main nav links
    const links = document.querySelectorAll('.main-nav a');
    links.forEach(a=>{
      const h = (ev)=>{ ev.preventDefault(); append('You cannot leave during surgery.'); vc.setBuddyText(window.generateRandomRamble ? window.generateRandomRamble() : 'Uhh, wait for surgery, believe me.'); };
      a.addEventListener('click', h);
      navHandlers.push({el:a, handler:h});
    });
  }
  function unlockNavigation(){
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    navHandlers.forEach(o=> o.el.removeEventListener('click', o.handler));
    navHandlers = [];
  }
  function beforeUnloadHandler(e){ const msg = 'Surgery in progress — leaving will cancel it.'; e.returnValue = msg; return msg; }

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
