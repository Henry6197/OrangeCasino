document.addEventListener('DOMContentLoaded', ()=>{
  const ACH_KEY = 'vc_achievements';

  const defs = [
    // Balance Achievements
    {id:'first_dollar', title:'💰 First Dollar', desc:'Earn your first dollar', reward: 10, check:()=> (vc.readBalance() >= 1001)},
    {id:'earn_2k', title:'💵 Small Fortune', desc:'Accumulate $2,000', reward: 100, check:()=> (vc.readBalance() >= 2000)},
    {id:'earn_5k', title:'💸 Getting Serious', desc:'Reach $5,000', reward: 250, check:()=> (vc.readBalance() >= 5000)},
    {id:'earn_10k', title:'💰 Five Figures', desc:'Earn $10,000', reward: 500, check:()=> (vc.readBalance() >= 10000)},
    {id:'earn_25k', title:'🏦 Big Money', desc:'Accumulate $25,000', reward: 1000, check:()=> (vc.readBalance() >= 25000)},
    {id:'earn_50k', title:'💎 High Roller', desc:'Reach $50,000', reward: 2000, check:()=> (vc.readBalance() >= 50000)},
    {id:'earn_100k', title:'🤑 Six Figures', desc:'Earn $100,000', reward: 3000, check:()=> (vc.readBalance() >= 100000)},
    {id:'earn_250k', title:'👑 Quarter Million', desc:'Accumulate $250,000', reward: 4000, check:()=> (vc.readBalance() >= 250000)},
    {id:'earn_500k', title:'💰 Half Million', desc:'Reach $500,000', reward: 4500, check:()=> (vc.readBalance() >= 500000)},
    {id:'earn_1m', title:'🏆 Millionaire', desc:'Become a millionaire!', reward: 4999, check:()=> (vc.readBalance() >= 1000000)},
    
    // Debt Achievements
    {id:'first_debt', title:'💳 Credit Card', desc:'Owe your first $100', reward: 25, check:()=> (vc.readDebt() >= 100)},
    {id:'debt_1k', title:'📉 In The Red', desc:'Accumulate $1,000 in debt', reward: 50, check:()=> (vc.readDebt() >= 1000)},
    {id:'debt_3k', title:'� Rising Debt', desc:'Owe $3,000', reward: 150, check:()=> (vc.readDebt() >= 3000)},
    {id:'debt_5k', title:'🔴 Danger Zone', desc:'Owe $5,000', reward: 200, check:()=> (vc.readDebt() >= 5000)},
    {id:'debt_max', title:'💀 Financial Ruin', desc:'Max out debt at $5,500+', reward: 500, check:()=> (vc.readDebt() >= 5500)},
    
    // Game-Specific Achievements
    {id:'slot_visitor', title:'🎰 Slot Virgin', desc:'Play the slot machine', reward: 50, check:()=> (localStorage.getItem('ach_visited_slots') === '1')},
    {id:'blackjack_visitor', title:'🃏 Card Counter', desc:'Play blackjack', reward: 50, check:()=> (localStorage.getItem('ach_visited_blackjack') === '1')},
    {id:'poker_visitor', title:'♠️ Poker Face', desc:'Play poker', reward: 50, check:()=> (localStorage.getItem('ach_visited_poker') === '1')},
    {id:'scratch_visitor', title:'🎫 Scratcher', desc:'Try scratch-off tickets', reward: 50, check:()=> (localStorage.getItem('ach_visited_scratch') === '1')},
    
    // Medical Achievements
    {id:'surgery_visitor', title:'🏥 Emergency Medicine', desc:'Visit the surgery center', reward: 200, check:()=> (localStorage.getItem('ach_surgery_visited') === '1')},
    
    // Underground Achievements
    {id:'underground_access', title:'🕳️ Down The Rabbit Hole', desc:'Discover the underground casino', reward: 200, check:()=> (localStorage.getItem('ach_visited_underground') === '1')},
    {id:'roulette_survivor', title:'🔫 Russian Roulette Survivor', desc:'Survive a round of Russian Roulette', reward: 300, check:()=> (localStorage.getItem('ach_roulette_survivor') === '1')},
    {id:'baccarat_player', title:'🩸 Blood Pact', desc:'Make a blood pact in baccarat', reward: 250, check:()=> (localStorage.getItem('ach_baccarat_played') === '1')},
    {id:'dogfight_better', title:'🐕‍🦺 Dog Fight Gambler', desc:'Bet on underground dog fights', reward: 200, check:()=> (localStorage.getItem('ach_dogfight_bet') === '1')},
    {id:'black_market', title:'🛒 Black Market Customer', desc:'Shop at the black market', reward: 150, check:()=> (localStorage.getItem('ach_shop_visited') === '1')},
    {id:'money_launderer', title:'🧽 Money Launderer', desc:'Launder dirty money', reward: 400, check:()=> (localStorage.getItem('ach_money_laundered') === '1')},
    
    // Special Location Achievements
    {id:'coal_escape', title:'🔑 Great Escape', desc:'Escape the factory using supervisor override', reward: 1000, check:()=> (localStorage.getItem('vc_coal_mine_escaped') === '1')},
    {id:'hells_casino', title:'🔥 Descent into Hell', desc:'Enter Hell\'s Casino', reward: 300, check:()=> (localStorage.getItem('ach_hells_visited') === '1')},
    {id:'hells_escape', title:'😇 Redemption', desc:'Escape Hell\'s Casino', reward: 1000, check:()=> (localStorage.getItem('ach_hells_escaped') === '1')},
    
    // Course and Business Achievements
    {id:'buy_course', title:'🎓 Student of Success', desc:'Buy Chad Moneybags\' Course', reward: 1000000, check:()=> (localStorage.getItem('vc_chads_course_owned') === '1')},
    {id:'passive_income', title:'💰 Passive Income', desc:'Earn $1,000 from Chad\'s course', reward: 300, check:()=> (Number(localStorage.getItem('vc_chads_course_total_earned') || 0) >= 1000)},
    
    // Milestone Achievements  
    {id:'achievement_hunter', title:'🏆 Achievement Hunter', desc:'Unlock 10 achievements', reward: 1000, check:()=> {
      const state = JSON.parse(localStorage.getItem('vc_achievements') || '{}');
      return Object.keys(state).length >= 10;
    }},
    {id:'completionist', title:'💯 Completionist', desc:'Unlock 25 achievements', reward: 2500, check:()=> {
      const state = JSON.parse(localStorage.getItem('vc_achievements') || '{}');
      return Object.keys(state).length >= 25;
    }},
    {id:'true_master', title:'👑 True Master', desc:'Unlock all achievements', reward: 5000000, check:()=> {
      const state = JSON.parse(localStorage.getItem('vc_achievements') || '{}');
      return Object.keys(state).length >= 36;
    }},
    
    // Hidden/Secret Achievements
    {id:'help_seeker', title:'❓ Help Seeker', desc:'Watch the help video', reward: 100, check:()=> (localStorage.getItem('ach_help_watched') === '1')},
    {id:'advertisement_click', title:'📺 Ad Viewer', desc:'Click on an advertisement', reward: 50, check:()=> (localStorage.getItem('ach_ad_clicked') === '1')},
    {id:'popup_survivor', title:'🚫 Popup Survivor', desc:'Survive popup hell', reward: 200, check:()=> (localStorage.getItem('ach_popup_survived') === '1')},
  ];

  function readState(){ try{ return JSON.parse(localStorage.getItem(ACH_KEY) || '{}'); }catch(e){ return {}; }}
  function writeState(s){ localStorage.setItem(ACH_KEY, JSON.stringify(s)); }

  function notifyUnlocked(def){ 
    try{ 
      // Give the achievement reward
      if(def.reward && def.reward > 0 && window.vc && typeof window.vc.readBalance === 'function' && typeof window.vc.writeBalance === 'function') {
        const currentBalance = window.vc.readBalance();
        window.vc.writeBalance(currentBalance + def.reward);
      }
      
      // Show achievement notification with reward amount
      if(window.vc && typeof window.vc.showBigMessage === 'function'){ 
        const rewardText = def.reward ? ` +$${def.reward}` : '';
        window.vc.showBigMessage(`${def.title} unlocked!${rewardText}`, 2000); 
      } 
      
      if(window.vc && typeof window.vc.confetti === 'function'){ 
        window.vc.confetti(36); 
      } 
      
      if(window.vc && typeof window.vc.setBuddyText === 'function'){ 
        const rewardText = def.reward ? ` Bonus: $${def.reward}!` : '';
        window.vc.setBuddyText(`Achievement unlocked: ${def.title}${rewardText}`); 
      } 
    }catch(e){}
    // also log to console for debugging
    console.log('Achievement unlocked:', def.id, def.title, `Reward: $${def.reward || 0}`);
  }

  function checkAll(){ const prev = readState(); const state = Object.assign({}, prev); const newly = []; defs.forEach(d=>{ if(!state[d.id] && d.check()){ state[d.id]=Date.now(); newly.push(d); } }); const changed = newly.length>0; if(changed) writeState(state); return {state, newly}; }

  function render(){ 
    const container = document.getElementById('achievements'); 
    if(!container) return; 
    const res = checkAll(); 
    const state = res.state; 
    const newly = res.newly || [];
    
    container.innerHTML=''; 
    defs.forEach(d=>{ 
      const el = document.createElement('div'); 
      el.className='achievement'; 
      const unlocked = !!state[d.id]; 
      const rewardText = d.reward ? ` (+$${d.reward})` : '';
      el.innerHTML = `
        <div class="ach-title">${d.title}${rewardText}</div>
        <div class="ach-desc">${d.desc || ''}</div>
        <div class="ach-status">${unlocked ? '<span class="done">✅ Unlocked</span>' : '<span class="locked">🔒 Locked</span>'}</div>
      `; 
      if(unlocked) el.classList.add('unlocked'); 
      container.appendChild(el); 
      
      // if newly unlocked, animate and notify
      const foundNew = newly.find(x=>x.id===d.id);
      if(foundNew){ 
        // small timeout so render finishes
        setTimeout(()=>{ 
          el.classList.add('fresh'); 
          setTimeout(()=> el.classList.remove('fresh'), 2000); 
        }, 40);
        notifyUnlocked(d);
      }
    }); 
    
    // Update achievement counter
    const total = defs.length;
    const completed = Object.keys(state).length;
    const counterEl = document.getElementById('achievement-counter');
    if(counterEl) {
      counterEl.textContent = `${completed}/${total} Achievements Unlocked`;
    }
  }

  // Achievement tracking functions
  window.vc = window.vc || {};
  
  // Game Visit Tracking
  window.vc.markSlotsVisited = function(){ 
    localStorage.setItem('ach_visited_slots', '1'); 
    render(); 
  };
  window.vc.markBlackjackVisited = function(){ 
    localStorage.setItem('ach_visited_blackjack', '1'); 
    render(); 
  };
  window.vc.markPokerVisited = function(){ 
    localStorage.setItem('ach_visited_poker', '1'); 
    render(); 
  };
  window.vc.markScratchVisited = function(){ 
    localStorage.setItem('ach_visited_scratch', '1'); 
    render(); 
  };
  
  // Underground Tracking
  window.vc.markUndergroundVisited = function(){ 
    localStorage.setItem('ach_visited_underground', '1'); 
    render(); 
  };
  window.vc.markRoulettePlay = function(){ 
    localStorage.setItem('ach_roulette_survivor', '1'); 
    render(); 
  };
  window.vc.markBaccaratPlay = function(){ 
    localStorage.setItem('ach_baccarat_played', '1'); 
    render(); 
  };
  window.vc.markDogfightBet = function(){ 
    localStorage.setItem('ach_dogfight_bet', '1'); 
    render(); 
  };
  window.vc.markShopVisited = function(){ 
    localStorage.setItem('ach_shop_visited', '1'); 
    render(); 
  };
  window.vc.markMoneyLaundered = function(){ 
    localStorage.setItem('ach_money_laundered', '1'); 
    render(); 
  };
  
  // Special Location Tracking
  window.vc.markCoalMineEscaped = function(){ 
    localStorage.setItem('vc_coal_mine_escaped', '1'); 
    render(); 
  };
  window.vc.markHellsVisited = function(){ 
    localStorage.setItem('ach_hells_visited', '1'); 
    render(); 
  };
  window.vc.markHellsEscaped = function(){ 
    localStorage.setItem('ach_hells_escaped', '1'); 
    render(); 
  };
  
  // Medical Tracking
  window.vc.markSurgeryVisited = function(){ 
    localStorage.setItem('ach_surgery_visited', '1'); 
    render(); 
  };
  
  // Business Tracking
  window.vc.markCoursePurchased = function(){ 
    localStorage.setItem('vc_chads_course_owned', '1'); 
    render(); 
  };
  
  // Misc Tracking
  window.vc.markHelpWatched = function(){ 
    localStorage.setItem('ach_help_watched', '1'); 
    render(); 
  };
  window.vc.markAdClicked = function(){ 
    localStorage.setItem('ach_ad_clicked', '1'); 
    render(); 
  };
  window.vc.markPopupSurvived = function(){ 
    localStorage.setItem('ach_popup_survived', '1'); 
    render(); 
  };

  // make checks reactive: override vc.updateBalance/updateDebt to re-render achievements
  if(window.vc && typeof window.vc.updateBalance === 'function' && typeof window.vc.updateDebt === 'function') {
    const origUpdateBalance = vc.updateBalance; const origUpdateDebt = vc.updateDebt;
    vc.updateBalance = function(){ origUpdateBalance(); render(); };
    vc.updateDebt = function(){ origUpdateDebt(); render(); };
  }

  // Custom Modal System for achievements page
  function showCustomModal(title, message, callback) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    
    modal.style.display = 'flex';
    
    const handleConfirm = () => {
      modal.style.display = 'none';
      modalConfirm.removeEventListener('click', handleConfirm);
      modalCancel.removeEventListener('click', handleCancel);
      callback(true);
    };
    
    const handleCancel = () => {
      modal.style.display = 'none';
      modalConfirm.removeEventListener('click', handleConfirm);
      modalCancel.removeEventListener('click', handleCancel);
      callback(false);
    };
    
    modalConfirm.addEventListener('click', handleConfirm);
    modalCancel.addEventListener('click', handleCancel);
  }

  document.getElementById('reset-achievements')?.addEventListener('click', ()=>{ 
    const message = `
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 3em; margin-bottom: 16px;">⚠️</div>
        <div style="font-size: 1.2em; font-weight: bold; color: #fca5a5; margin-bottom: 12px;">COMPLETE RESET WARNING</div>
        <div style="line-height: 1.6; margin-bottom: 16px;">
          This will reset <strong>EVERYTHING</strong> including:
        </div>
        <div style="text-align: left; display: inline-block; margin-bottom: 16px;">
          • All achievements and progress<br>
          • Balance (back to $1,000)<br>
          • Debt (back to $0)<br>
          • Platinum Credits<br>
          • All promo codes<br>
          • VIP status and perks<br>
          • All game history<br>
        </div>
        <div style="font-weight: bold; color: #fbbf24;">
          This action cannot be undone!
        </div>
      </div>
    `;
    
    showCustomModal('🔄 Reset Everything?', message, (confirmed) => {
      if (!confirmed) return;
    
    // Clear ALL localStorage items
    localStorage.clear();
    
    render(); 
    
    // Reset balance and debt displays
    if (window.vc) {
      if (typeof window.vc.updateBalance === 'function') window.vc.updateBalance();
      if (typeof window.vc.updateDebt === 'function') window.vc.updateDebt();
      if (typeof window.vc.showBigMessage === 'function') {
        window.vc.showBigMessage('🔄 Complete reset! Everything restored to default.', 3000);
      }
      if (typeof window.vc.setBuddyText === 'function') {
        window.vc.setBuddyText('Fresh start! All your data has been reset.');
      }
    }
    
    // Reload the page after a short delay to ensure everything resets properly
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    });
  });

  // Expose render function for external achievement checking
  window.vc = window.vc || {};
  window.vc.render = render;

  render();
});
