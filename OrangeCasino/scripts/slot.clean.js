document.addEventListener('DOMContentLoaded', ()=>{
  // Clean slot logic: 5x3 grid, evaluate contiguous row runs and full-column matches.
  const symbols = ['🍒','🍋','⭐','🍇','🔔','🍉'];
  const spinBtn = document.getElementById('spin');
  const maxBtn = document.getElementById('max');
  const reels = Array.from(document.querySelectorAll('.reel'));
  const log = document.getElementById('slot-log');
  const betInput = document.getElementById('bet');

  function rand(n){ return Math.floor(Math.random()*n); }
  function appendLog(s){ if(!log) return; const p=document.createElement('div'); p.textContent=s; log.prepend(p); }

  function showLossUI(){ vc.setBuddyText(window.TODD_DIALOGUE?.slots?.loss || "Don't be down — double down next time!"); vc.showBigMessage('YOU LOST', 1000); }
  function showWinUI(amount){ vc.setBuddyText(window.TODD_DIALOGUE?.slots?.win || "Hell yes! Keep it up!"); vc.confetti(40); vc.showBigMessage(`You won $${amount}!!`, 1400); }

  function rowIndices(row){ const base = row*5; return [base, base+1, base+2, base+3, base+4]; }
  function colIndices(col){ return [col, col+5, col+10]; }

  function evaluatePatterns(result){
    // We'll build non-overlapping patterns and prefer higher-value patterns first.
    const used = new Set();
    const results = [];

    // 1) columns (highest value) - check each column for 3-of-a-kind
    for(let c=0;c<5;c++){
      const idxs = colIndices(c);
      const s0 = result[idxs[0]];
      if(s0 && result[idxs[1]]===s0 && result[idxs[2]]===s0){
        // ensure indices not already used
        if(!idxs.some(i=> used.has(i))){ idxs.forEach(i=> used.add(i)); results.push({type:'col', indices: idxs.slice(), symbol: s0}); }
      }
    }

    // 2) full rows (5 in a row)
    for(let r=0;r<3;r++){
      const idxs = rowIndices(r);
      const s0 = result[idxs[0]];
      if(s0 && idxs.every(i=> result[i]===s0) && !idxs.some(i=> used.has(i))){ idxs.forEach(i=> used.add(i)); results.push({type:'row', indices: idxs.slice(), symbol: s0}); }
    }

    // 3) 4-in-row contiguous
    for(let r=0;r<3;r++){
      const idxs = rowIndices(r);
      for(let start=0; start<=1; start++){
        const seg = idxs.slice(start,start+4);
        const s0 = result[seg[0]];
        if(s0 && seg.every(i=> result[i]===s0) && !seg.some(i=> used.has(i))){ seg.forEach(i=> used.add(i)); results.push({type:'row', indices: seg.slice(), symbol: s0}); }
      }
    }

    // 4) 3-in-row contiguous
    for(let r=0;r<3;r++){
      const idxs = rowIndices(r);
      for(let start=0; start<=2; start++){
        const seg = idxs.slice(start,start+3);
        const s0 = result[seg[0]];
        if(s0 && seg.every(i=> result[i]===s0) && !seg.some(i=> used.has(i))){ seg.forEach(i=> used.add(i)); results.push({type:'row', indices: seg.slice(), symbol: s0}); }
      }
    }

    return results;
  }

  function computePayout(bet, patterns){
    let total = 0;
    // deterministic multipliers
    patterns.forEach(p=>{
      if(p.type === 'col'){
        total += bet * 5; // column of 3 pays 5x
      } else if(p.type === 'row'){
        const len = p.indices.length;
        if(len === 3) total += bet * 2;    // 2x for a 3-run
        else if(len === 4) total += bet * 4; // 4x for 4-run
        else if(len >= 5) total += bet * 8; // 8x for full row
      }
    });
    return total;
  }

  // prevent re-entrant spins
  let spinning = false;

  function spin(bet){
    if(spinning){ appendLog('Spin already in progress.'); return; }
    spinning = true;
    if(spinBtn) spinBtn.disabled = true;
    if(maxBtn) maxBtn.disabled = true;
    let balance = vc.readBalance();
    if(bet <= 0){ appendLog('Invalid bet.'); spinning = false; if(spinBtn) spinBtn.disabled = false; if(maxBtn) maxBtn.disabled = false; return; }
    if(bet > balance){ appendLog('Insufficient funds for that bet.'); vc.setBuddyText(window.TODD_DIALOGUE?.slots?.insufficientFunds || 'Not enough funds — try a smaller bet or take a loan.'); spinning = false; if(spinBtn) spinBtn.disabled = false; if(maxBtn) maxBtn.disabled = false; return; }
    balance -= bet; vc.writeBalance(balance);

    try{ if(window.vc && typeof window.vc.incrementSlotSpins === 'function') window.vc.incrementSlotSpins(1); }catch(e){}
    
    // Generate random result with natural chance for patterns
    const result = new Array(reels.length).fill(null).map(()=> symbols[rand(symbols.length)]);

    // Occasionally create winning patterns to make the game more fun
    if(Math.random() < 0.25){ // 25% chance for intentional patterns
      if(Math.random() < 0.7){
        // Create a contiguous row run (3, 4, or 5 in a row)
        const s = symbols[rand(symbols.length)];
        const row = rand(3);
        // More likely to create 3-in-row, less likely for longer runs
        let runLen = 3;
        if(Math.random() < 0.3) runLen = 4; // 30% chance for 4-in-row
        if(Math.random() < 0.15) runLen = 5; // 15% chance for full row
        
        const idxs = rowIndices(row);
        const maxStart = 5 - runLen;
        const startInRow = Math.floor(Math.random()*(maxStart+1));
        for(let k=0;k<runLen;k++){ result[idxs[startInRow+k]] = s; }
      } else {
        // Create a full column (3 matching vertically)
        const s = symbols[rand(symbols.length)]; 
        const col = rand(5); 
        const idxs = colIndices(col); 
        idxs.forEach(i=> result[i]=s);
      }
    }

    reels.forEach((r,i)=>{ r.classList.add('spin'); r.textContent = '🎰'; setTimeout(()=>{ r.textContent = result[i]; r.classList.remove('spin'); }, 300 + (i%5)*120 + Math.floor(i/5)*60); });

    setTimeout(()=>{
      try{
        const patterns = evaluatePatterns(result);
        const payout = computePayout(bet, patterns);
        
        if(payout > 0){
          balance += payout; 
          vc.writeBalance(balance);
          
          // Build detailed pattern description
          let patternDesc = patterns.map(p=> {
            const symbol = p.symbol;
            if(p.type === 'col') return `${symbol}${symbol}${symbol} column`;
            else if(p.indices.length === 5) return `${symbol}${symbol}${symbol}${symbol}${symbol} full row`;
            else if(p.indices.length === 4) return `${symbol}${symbol}${symbol}${symbol} 4-in-row`;
            else return `${symbol}${symbol}${symbol} 3-in-row`;
          }).join(', ');
          
          appendLog(`You won $${payout}! (${patternDesc})`);
          showWinUI(payout);
        }
        else { 
          appendLog(`No winning patterns — ${result.join(' ')}`); 
          showLossUI(); 
        }
      }catch(err){
        appendLog('Spin error: ' + (err && err.message ? err.message : String(err)));
        console.error(err);
      }finally{
        // re-enable controls shortly after overlay/animations
        setTimeout(()=>{
          spinning = false;
          if(spinBtn) spinBtn.disabled = false;
          if(maxBtn) maxBtn.disabled = false;
        }, 400);
      }
    }, 1200 + reels.length*80);
  }

  if(spinBtn) spinBtn.addEventListener('click', ()=> spin(Number(betInput.value||10)));
  if(maxBtn) maxBtn.addEventListener('click', ()=>{ const max = Math.max(1, Math.floor(vc.readBalance()||0)); betInput.value = max; spin(max); });
});
