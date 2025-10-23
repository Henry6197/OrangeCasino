document.addEventListener('DOMContentLoaded', ()=>{
  const TIMER_KEY = 'vc_appendix_timer';
  const log = document.getElementById('appendix-log');
  const timerEl = document.getElementById('appendix-timer');

  function append(s){ if(!log) return; const p=document.createElement('div'); p.textContent=s; log.prepend(p); }

  // start or resume 10-minute timer
  const finishAt = Number(localStorage.getItem(TIMER_KEY) || 0);
  const start = Date.now();
  let target = finishAt && finishAt > start ? finishAt : (Date.now() + 10*60*1000);
  localStorage.setItem(TIMER_KEY, String(target));

  append('Lying down... please wait 10 minutes to receive $3.');

  // lock navigation similar to surgery
  let navHandlers = [];
  function lockNavigation(){ window.addEventListener('beforeunload', beforeUnloadHandler); const links = document.querySelectorAll('.main-nav a'); links.forEach(a=>{ const h=(ev)=>{ ev.preventDefault(); append('You cannot leave during the procedure.'); vc.setBuddyText('Wait until the procedure finishes.'); }; a.addEventListener('click', h); navHandlers.push({el:a, handler:h}); }); }
  function unlockNavigation(){ window.removeEventListener('beforeunload', beforeUnloadHandler); navHandlers.forEach(o=> o.el.removeEventListener('click', o.handler)); navHandlers = []; }
  function beforeUnloadHandler(e){ const msg = 'Procedure in progress — leaving will cancel it.'; e.returnValue = msg; return msg; }

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
      // pay user $3
      const balance = vc.readBalance(); vc.writeBalance(balance + 3);
      localStorage.removeItem(TIMER_KEY);
      
      // Mark achievement for selling appendix
      try{ if(window.vc && typeof window.vc.markAppendixUsed === 'function') window.vc.markAppendixUsed(); }catch(e){}
      
      append('Procedure complete. You received $3.');
      vc.setBuddyText('You made $3.');
      vc.showBigMessage('Procedure complete! $3', 1600);
      unlockNavigation();
    }
  }, 500);

});
