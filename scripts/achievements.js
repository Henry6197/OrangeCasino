document.addEventListener('DOMContentLoaded', ()=>{
  const ACH_KEY = 'vc_achievements';
  const SPIN_KEY = 'vc_slot_spins';

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
    {id:'spin_10', title:'Spin the slots 10 times', check:()=> (readSpinCount() >= 10)},
    {id:'spin_20', title:'Spin the slots 20 times', check:()=> (readSpinCount() >= 20)},
    {id:'spin_50', title:'Spin the slots 50 times', check:()=> (readSpinCount() >= 50)},
    {id:'spin_100', title:'Spin the slots 100 times', check:()=> (readSpinCount() >= 100)},
    {id:'spin_200', title:'Spin the slots 200 times', check:()=> (readSpinCount() >= 200)},
    {id:'blackjack_natural', title:'Get a blackjack in Blackjack', check:()=> (readBlackjackStats().naturals >= 1)},
    {id:'blackjack_5', title:'Play Blackjack 5 times', check:()=> (readBlackjackStats().plays >= 5)},
    {id:'blackjack_10', title:'Play Blackjack 10 times', check:()=> (readBlackjackStats().plays >= 10)},
    {id:'blackjack_20', title:'Play Blackjack 20 times', check:()=> (readBlackjackStats().plays >= 20)},
    {id:'blackjack_50', title:'Play Blackjack 50 times', check:()=> (readBlackjackStats().plays >= 50)},
    {id:'coal_mine', title:'Get sent to the coal mine', check:()=> (localStorage.getItem('vc_coal_mine_visited') === '1')},
    {id:'mine_1_coal', title:'Mine 1 coal', check:()=> (readCoalStats().mined >= 1)},
    {id:'mine_5_coal', title:'Mine 5 coal', check:()=> (readCoalStats().mined >= 5)},
    {id:'mine_100_coal', title:'Mine 100 coal', check:()=> (readCoalStats().mined >= 100)},
    {id:'coal_escape', title:'Secret: Escape the coal mine using the key', check:()=> (localStorage.getItem('vc_coal_mine_escaped') === '1')},
    {id:'sell_kidney', title:'Sell a kidney', check:()=> (localStorage.getItem('vc_surgery_used') === '1')},
    {id:'sell_appendix', title:'Sell your appendix', check:()=> (localStorage.getItem('vc_appendix_used') === '1')},
    {id:'buy_course', title:"Buy Chad Moneybags' Course", check:()=> (localStorage.getItem('vc_clicked_ad') === '1')},
  ];

  function readState(){ try{ return JSON.parse(localStorage.getItem(ACH_KEY) || '{}'); }catch(e){ return {}; }}
  function writeState(s){ localStorage.setItem(ACH_KEY, JSON.stringify(s)); }
  function readSpinCount(){ return Number(localStorage.getItem(SPIN_KEY) || 0); }
  function writeSpinCount(n){ localStorage.setItem(SPIN_KEY, String(n)); }
  
  // Blackjack tracking
  const BLACKJACK_KEY = 'vc_blackjack_stats';
  function readBlackjackStats(){ 
    try{ 
      const data = JSON.parse(localStorage.getItem(BLACKJACK_KEY) || '{}'); 
      return { plays: data.plays || 0, naturals: data.naturals || 0 };
    }catch(e){ return { plays: 0, naturals: 0 }; }
  }
  function writeBlackjackStats(stats){ localStorage.setItem(BLACKJACK_KEY, JSON.stringify(stats)); }

  // Coal mining tracking
  const COAL_KEY = 'vc_coal_stats';
  function readCoalStats(){ 
    try{ 
      const data = JSON.parse(localStorage.getItem(COAL_KEY) || '{}'); 
      return { mined: data.mined || 0 };
    }catch(e){ return { mined: 0 }; }
  }
  function writeCoalStats(stats){ localStorage.setItem(COAL_KEY, JSON.stringify(stats)); }

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

  // expose increment for slots and blackjack tracking
  window.vc = window.vc || {};
  window.vc.incrementSlotSpins = function(n=1){ const v = readSpinCount()+n; writeSpinCount(v); render(); };
  window.vc.incrementBlackjackPlays = function(n=1){ 
    const stats = readBlackjackStats(); 
    stats.plays += n; 
    writeBlackjackStats(stats); 
    render(); 
  };
  window.vc.incrementBlackjackNaturals = function(n=1){ 
    const stats = readBlackjackStats(); 
    stats.naturals += n; 
    writeBlackjackStats(stats); 
    render(); 
  };
  window.vc.markCoalMineVisited = function(){ 
    localStorage.setItem('vc_coal_mine_visited', '1'); 
    render(); 
  };
  window.vc.incrementCoalMined = function(n=1){ 
    const stats = readCoalStats(); 
    stats.mined += n; 
    writeCoalStats(stats); 
    render(); 
  };
  window.vc.markCoalMineEscaped = function(){ 
    localStorage.setItem('vc_coal_mine_escaped', '1'); 
    render(); 
  };
  window.vc.markAdClicked = function(){ 
    localStorage.setItem('vc_clicked_ad', '1'); 
    render(); 
  };

  // make checks reactive: override vc.updateBalance/updateDebt to re-render achievements
  const origUpdateBalance = vc.updateBalance; const origUpdateDebt = vc.updateDebt;
  vc.updateBalance = function(){ origUpdateBalance(); render(); };
  vc.updateDebt = function(){ origUpdateDebt(); render(); };

  document.getElementById('reset-achievements')?.addEventListener('click', ()=>{ localStorage.removeItem(ACH_KEY); localStorage.removeItem(SPIN_KEY); render(); });

  render();
});
