document.addEventListener('DOMContentLoaded', ()=>{
  const ACH_KEY = 'vc_achievements';

  const defs = [
    {id:'earn_2k', title:'Earn $2K', check:()=> (vc.readBalance() >= 2000)},
    {id:'earn_5k', title:'Earn $5K', check:()=> (vc.readBalance() >= 5000)},
    {id:'earn_10k', title:'Earn $10K', check:()=> (vc.readBalance() >= 10000)},
    {id:'earn_20k', title:'Earn $20K', check:()=> (vc.readBalance() >= 20000)},
    {id:'earn_50k', title:'Earn $50K', check:()=> (vc.readBalance() >= 50000)},
    {id:'earn_100k', title:'Earn $100K', check:()=> (vc.readBalance() >= 100000)},
    {id:'earn_1m', title:'Earn $1M', check:()=> (vc.readBalance() >= 1000000)},
    {id:'debt_1k', title:'Have $1K in debt', check:()=> (vc.readDebt() >= 1000)},
    {id:'debt_5k', title:'Have $5K in debt', check:()=> (vc.readDebt() >= 5000)},
    {id:'coal_mine', title:'Get sent to the chip factory', check:()=> (localStorage.getItem('vc_coal_mine_visited') === '1')},
    {id:'coal_escape', title:'Secret: Escape the factory using supervisor override', check:()=> (localStorage.getItem('vc_coal_mine_escaped') === '1')},
    {id:'sell_kidney', title:'Sell a kidney', check:()=> (localStorage.getItem('vc_surgery_used') === '1')},
    {id:'sell_appendix', title:'Sell your appendix', check:()=> (localStorage.getItem('vc_appendix_used') === '1')},
    {id:'buy_course', title:"Buy Chad Moneybags' Course", check:()=> (localStorage.getItem('vc_chads_course_owned') === '1')},
  ];

  function readState(){ try{ return JSON.parse(localStorage.getItem(ACH_KEY) || '{}'); }catch(e){ return {}; }}
  function writeState(s){ localStorage.setItem(ACH_KEY, JSON.stringify(s)); }

  function notifyUnlocked(def){ try{ if(window.vc && typeof window.vc.showBigMessage === 'function'){ window.vc.showBigMessage(`${def.title} unlocked!`, 1600); } if(window.vc && typeof window.vc.confetti === 'function'){ window.vc.confetti(36); } if(window.vc && typeof window.vc.setBuddyText === 'function'){ window.vc.setBuddyText(`Achievement unlocked: ${def.title}`); } }catch(e){}
    // also log to console for debugging
    console.log('Achievement unlocked:', def.id, def.title);
  }

  function checkAll(){ const prev = readState(); const state = Object.assign({}, prev); const newly = []; defs.forEach(d=>{ if(!state[d.id] && d.check()){ state[d.id]=Date.now(); newly.push(d); } }); const changed = newly.length>0; if(changed) writeState(state); return {state, newly}; }

  function render(){ const container = document.getElementById('achievements'); if(!container) return; const res = checkAll(); const state = res.state; const newly = res.newly || [];
    container.innerHTML=''; defs.forEach(d=>{ const el = document.createElement('div'); el.className='achievement'; const unlocked = !!state[d.id]; el.innerHTML = `<div class="ach-title">${d.title}</div><div class="ach-status">${unlocked ? '<span class="done">Unlocked</span>' : '<span class="locked">Locked</span>'}</div>`; if(unlocked) el.classList.add('unlocked'); container.appendChild(el); // if newly unlocked, animate and notify
      const foundNew = newly.find(x=>x.id===d.id);
      if(foundNew){ // small timeout so render finishes
        setTimeout(()=>{ el.classList.add('fresh'); setTimeout(()=> el.classList.remove('fresh'), 1600); }, 40);
        notifyUnlocked(d);
      }
    }); }

  // expose increment functions as stubs to prevent errors
  window.vc = window.vc || {};
  window.vc.incrementSlotSpins = function(n=1){ 
    // No longer tracking slot spins for achievements
    return;
  };
  window.vc.incrementBlackjackPlays = function(n=1){ 
    // No longer tracking blackjack plays for achievements
    return;
  };
  window.vc.incrementBlackjackNaturals = function(n=1){ 
    // No longer tracking blackjack naturals for achievements
    return;
  };
  window.vc.incrementCoalMined = function(n=1){ 
    // No longer tracking chip assembly for achievements
    return;
  };
  window.vc.markCoalMineVisited = function(){ 
    localStorage.setItem('vc_coal_mine_visited', '1'); 
    render(); 
  };
  window.vc.markCoalMineEscaped = function(){ 
    localStorage.setItem('vc_coal_mine_escaped', '1'); 
    render(); 
  };
  window.vc.markSurgeryUsed = function(){ 
    localStorage.setItem('vc_surgery_used', '1'); 
    render(); 
  };
  window.vc.markAppendixUsed = function(){ 
    localStorage.setItem('vc_appendix_used', '1'); 
    render(); 
  };
  window.vc.incrementPokerPlays = function(n=1){ 
    // No longer tracking poker plays for achievements
    return;
  };
  window.vc.markCoursePurchased = function(){ 
    localStorage.setItem('vc_chads_course_owned', '1'); 
    render(); 
  };

  // make checks reactive: override vc.updateBalance/updateDebt to re-render achievements
  if(window.vc && typeof window.vc.updateBalance === 'function' && typeof window.vc.updateDebt === 'function') {
    const origUpdateBalance = vc.updateBalance; const origUpdateDebt = vc.updateDebt;
    vc.updateBalance = function(){ origUpdateBalance(); render(); };
    vc.updateDebt = function(){ origUpdateDebt(); render(); };
  }

  document.getElementById('reset-achievements')?.addEventListener('click', ()=>{ 
    localStorage.removeItem(ACH_KEY); 
    localStorage.removeItem('vc_coal_mine_visited'); // Factory visit tracking
    localStorage.removeItem('vc_coal_mine_escaped'); // Factory escape tracking
    localStorage.removeItem('vc_surgery_used');
    localStorage.removeItem('vc_appendix_used');
    localStorage.removeItem('vc_chads_course_owned');
    render(); 
  });

  render();
});
