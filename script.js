// Slot Inspirado — 3x3 — educativo e original
(() => {
  'use strict';

  // DOM helpers
  const $ = id => document.getElementById(id);
  const gridEl = document.getElementById('grid');
  const balanceEl = document.getElementById('balance');
  const betValueEl = document.getElementById('betValue');
  const lastWinEl = document.getElementById('lastWin');
  const messageEl = document.getElementById('message');
  const btnSpin = document.getElementById('btnSpin');
  const btnAuto = document.getElementById('btnAuto');
  const btnExport = document.getElementById('btnExport');
  const betDown = document.getElementById('betDown');
  const betUp = document.getElementById('betUp');

  // State
  let state = {
    balance: 100.00,
    bet: 0.5,
    symbols: ['star','clover','bell','gem','tiger'],
    // weights for randomness (higher = more common)
    weights: {'star': 18,'clover': 16,'bell': 30,'gem': 9,'tiger': 2},
    history: [],
    auto: false,
    autoInterval: null
  };

  // payout table (multipliers * bet)
  const PAYOUT = {
    'star': {3:12, 2:2},
    'clover': {3:8, 2:1.5},
    'bell': {3:5, 2:1},
    'gem': {3:20, 2:3},
    'tiger': {3:50}
  };

  // utilities
  function fmt(v){ return 'R$' + v.toFixed(2).replace('.',','); }
  function randWeightedPick(weights){
    // weights: object symbol->weight
    const entries = Object.entries(weights);
    const total = entries.reduce((s,[_k,w])=>s+w,0);
    let r = Math.random() * total;
    for(const [k,w] of entries){
      if (r < w) return k;
      r -= w;
    }
    return entries[0][0];
  }

  // build grid DOM (3x3)
  function buildGrid(){
    gridEl.innerHTML = '';
    for(let r=0;r<3;r++){
      for(let c=0;c<3;c++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.innerHTML = renderSymbol(''); // empty initially
        gridEl.appendChild(cell);
      }
    }
  }

  // simple SVG icons for symbols (original)
  function renderSymbol(name){
    // returns HTML with inline SVG or text placeholder
    if (!name) return '<div style="opacity:0.25">—</div>';
    switch(name){
      case 'star':
        return `<div class="sym">⭐<span class="label">Estrela</span></div>`;
      case 'clover':
        return `<div class="sym">🍀<span class="label">Trevo</span></div>`;
      case 'bell':
        return `<div class="sym">🔔<span class="label">Sino</span></div>`;
      case 'gem':
        return `<div class="sym">💎<span class="label">Joia</span></div>`;
      case 'tiger':
        return `<div class="sym">🐯<span class="label">Tigre</span></div>`;
      default:
        return `<div>${name}</div>`;
    }
  }

  // render ui
  function renderUI(){
    balanceEl.textContent = '💰 Saldo: ' + fmt(state.balance);
    betValueEl.textContent = fmt(state.bet);
    lastWinEl.textContent = 'Ganho: R$0,00';
  }

  // spin mechanics: produce 3x3 matrix of symbols (rows)
  function spinOnce(){
    // simulate reels with weighted picks
    const matrix = [];
    for(let r=0;r<3;r++){
      matrix[r] = [];
      for(let c=0;c<3;c++){
        matrix[r][c] = randWeightedPick(state.weights);
      }
    }
    return matrix;
  }

  // animate spin: progressively fill cells with small delays
  async function animateSpin(matrix){
    const cells = Array.from(document.querySelectorAll('.cell'));
    // animate by rows top to bottom
    for(let r=0;r<3;r++){
      for(let c=0;c<3;c++){
        const idx = r*3 + c;
        const cell = cells[idx];
        // temporary "rolling" effect
        cell.classList.remove('win');
        cell.style.transform = 'translateY(-8px)';
        cell.innerHTML = renderSymbol('');
      }
      // small pause per row for effect
      await new Promise(res => setTimeout(res, 160));
      for(let c=0;c<3;c++){
        const idx = r*3 + c;
        const cell = cells[idx];
        cell.innerHTML = renderSymbol(matrix[r][c]);
        cell.style.transform = 'translateY(0)';
      }
    }
  }

  // evaluate central payline (row 1)
  function evaluate(matrix){
    const midRow = matrix[1]; // row index 1
    // count occurrences
    const counts = {};
    for(const s of midRow) counts[s] = (counts[s]||0)+1;
    // find payouts: priority to 3 of a kind
    let payout = 0;
    let winSymbols = [];
    for(const sym of Object.keys(counts)){
      const cnt = counts[sym];
      if (PAYOUT[sym][cnt]){
        payout += PAYOUT[sym][cnt] * state.bet;
        winSymbols.push({sym,cnt,mult:PAYOUT[sym][cnt]});
      } else if (cnt === 2 && PAYOUT[sym][2]){
        payout += PAYOUT[sym][2] * state.bet;
        winSymbols.push({sym,cnt,mult:PAYOUT[sym][2]});
      }
    }
    return {payout, winSymbols, midRow};
  }

  // perform spin action
  async function doSpin(){
    if (state.balance < state.bet) {
      messageEl.textContent = 'Saldo insuficiente para apostar.';
      return;
    }
    // deduct bet first
    state.balance = +(state.balance - state.bet).toFixed(2);
    renderUI();
    messageEl.textContent = 'Girando...';
    btnSpin.disabled = true;

    const matrix = spinOnce();
    await animateSpin(matrix);

    const res = evaluate(matrix);
    const win = +(res.payout).toFixed(2);
    if (win > 0){
      state.balance = +(state.balance + win).toFixed(2);
      lastWinEl.textContent = 'Ganho: ' + fmt(win);
      messageEl.textContent = 'Parabéns! Ganhou ' + fmt(win);
      // highlight winning symbols on middle row
      highlightWins(res.midRow);
    } else {
      lastWinEl.textContent = 'Ganho: R$0,00';
      messageEl.textContent = 'Sem ganho. Tente novamente.';
    }

    // push history
    const entry = {
      time: new Date().toISOString(),
      bet: state.bet,
      midRow: res.midRow,
      win: win,
      balance: state.balance
    };
    state.history.unshift(entry);
    if (state.history.length > 200) state.history.length = 200;

    renderUI();
    btnSpin.disabled = false;
  }

  function highlightWins(midRow){
    const cells = Array.from(document.querySelectorAll('.cell'));
    // middle row indices: 3,4,5
    for(let i=0;i<3;i++){
      const idx = 3 + i;
      const cell = cells[idx];
      cell.classList.add('win');
    }
  }

  // CSV export
  function exportCSV(){
    if (!state.history.length){ alert('Nenhuma jogada para exportar.'); return; }
    const header = ['time','bet','midRow','win','balance'];
    const rows = state.history.map(h => [
      h.time, h.bet, '"' + h.midRow.join('|') + '"', h.win, h.balance
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history_slot.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // auto-spin toggle
  function toggleAuto(){
    state.auto = !state.auto;
    if (state.auto){
      btnAuto.textContent = 'AUTO ✓';
      state.autoInterval = setInterval(() => {
        if (state.balance >= state.bet) doSpin();
        else toggleAuto();
      }, 900);
    } else {
      btnAuto.textContent = 'AUTO';
      clearInterval(state.autoInterval);
      state.autoInterval = null;
    }
  }

  // bet adjust
  function adjustBet(delta){
    const newBet = +(state.bet + delta);
    state.bet = Math.max(0.1, Math.round(newBet*100)/100);
    betValueEl.textContent = fmt(state.bet);
  }

  // initial setup
  buildGrid();
  renderUI();

  // events
  btnSpin.addEventListener('click', doSpin);
  btnExport.addEventListener('click', exportCSV);
  btnAuto.addEventListener('click', toggleAuto);
  betDown.addEventListener('click', ()=>adjustBet(-0.1));
  betUp.addEventListener('click', ()=>adjustBet(0.1));

  // accessibility: enter to spin
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSpin(); });

  // explain math in console for teacher (can be shown in class)
  console.info('Explicação: Math.random() usado para seleção ponderada; ética: símbolos originais; paytable define expectativa por símbolo.');

})();
