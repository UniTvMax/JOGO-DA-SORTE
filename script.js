// Jogo da Sorte — otimizado e comentado
(() => {
  'use strict';

  // Config
  const MAX_HISTORY = 20;
  const STORAGE_KEY = 'jogo_da_sorte_v1';

  // DOM
  const el = id => document.getElementById(id);
  const btnStart = el('btnStart');
  const btnJogar = el('btnJogar');
  const btnResetHistory = el('btnResetHistory');
  const saldoEl = el('saldo');
  const msgEl = el('mensagem');
  const resultadoBox = el('resultadoBox');
  const historicoEl = el('historico');
  const apostaInput = el('aposta');
  const saldoInicialInput = el('saldoInicial');
  const dificuldadeSelect = el('dificuldade');
  const probabilidadesEl = el('probabilidades');

  // Canvas chart
  const canvas = el('chart');
  const ctx = canvas.getContext('2d');

  // Estado
  let state = {
    saldo: 100,
    aposta: 10,
    historico: [],
    series: [], // saldo ao longo do tempo
    running: false,
    dificuldade: 'normal'
  };

  // --- Utilitários ---
  function randInt(min, max) { // inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  // --- Persistência local ---
  function saveState() {
    try {
      const toSave = {
        saldo: state.saldo,
        aposta: state.aposta,
        historico: state.historico,
        series: state.series,
        dificuldade: state.dificuldade
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.warn('Não foi possível salvar estado:', err);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      state.saldo = typeof s.saldo === 'number' ? s.saldo : state.saldo;
      state.aposta = typeof s.aposta === 'number' ? s.aposta : state.aposta;
      state.historico = Array.isArray(s.historico) ? s.historico : [];
      state.series = Array.isArray(s.series) ? s.series : [state.saldo];
      state.dificuldade = s.dificuldade || state.dificuldade;
      return true;
    } catch (err) {
      console.warn('Erro ao carregar estado', err);
      return false;
    }
  }

  // --- Regras do jogo (fácil de explicar na aula) ---
  // Gera um número de 1 a 10.
  // Probabilidades ajustadas por dificuldade:
  // Normal: 7 -> +5x aposta (10%); 1 ou 2 -> -2x aposta (20%); resto 70%: sem mudança.
  // Fácil: maior chance de ganhar; Difícil: maior chance de perder.
  function getOutcome(dificuldade) {
    const n = randInt(1, 10);
    let result = { n, delta: 0, text: '' };

    // multiplicadores relative à aposta
    const a = state.aposta;
    if (dificuldade === 'easy') {
      // make 7 and 8 rewards, reduce penalties
      if (n === 7 || n === 8) { result.delta = Math.round(a * 4); result.text = 'Grande vitória!'; }
      else if (n === 1) { result.delta = -Math.round(a * 1.5); result.text = 'Pequena perda.'; }
      else { result.delta = 0; result.text = 'Nada.'; }
    } else if (dificuldade === 'hard') {
      if (n === 7) { result.delta = Math.round(a * 6); result.text = 'Mega acerto!'; }
      else if (n === 1 || n === 2 || n === 3) { result.delta = -Math.round(a * 2.5); result.text = 'Perda forte.'; }
      else { result.delta = 0; result.text = 'Nada.'; }
    } else { // normal
      if (n === 7) { result.delta = Math.round(a * 5); result.text = 'Você ganhou!'; }
      else if (n === 1 || n === 2) { result.delta = -Math.round(a * 2); result.text = 'Você perdeu.'; }
      else { result.delta = 0; result.text = 'Nada.'; }
    }

    return result;
  }

  // --- UI Atualizações ---
  function renderSaldo() {
    saldoEl.textContent = `💰 Saldo: ${state.saldo} moedas`;
  }

  function renderProbabilidades() {
    // Exibir probabilidades simples para apresentação
    probabilidadesEl.textContent = 'Probabilidades (estimadas): vitória rara, perda moderada, empate comum.';
  }

  function pushHistory(entry) {
    state.historico.unshift(entry);
    if (state.historico.length > MAX_HISTORY) state.historico.length = MAX_HISTORY;
  }

  function renderHistory() {
    historicoEl.innerHTML = '';
    state.historico.forEach(h => {
      const li = document.createElement('li');
      li.textContent = `${h.time} — num:${h.n} — ${h.msg} — ${h.delta>0?'+':''}${h.delta} — saldo:${h.saldoAfter}`;
      historicoEl.appendChild(li);
    });
  }

  // --- Chart (canvas) ---
  function drawChart() {
    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = 200 * devicePixelRatio;
    ctx.clearRect(0,0,w,h);

    const series = state.series.length ? state.series : [state.saldo];
    const max = Math.max(...series, 10);
    const min = Math.min(...series, 0);
    const pad = 20 * devicePixelRatio;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    // axes lines
    ctx.lineWidth = 1 * devicePixelRatio;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // draw line
    ctx.beginPath();
    series.forEach((v,i) => {
      const x = pad + (i / Math.max(1, series.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / Math.max(1, max - min)) * innerH;
      if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = 'rgba(6,182,212,0.9)';
    ctx.lineWidth = 2 * devicePixelRatio;
    ctx.stroke();

    // last point
    const last = series[series.length - 1];
    const lx = pad + ((series.length - 1) / Math.max(1, series.length -1)) * innerW;
    const ly = pad + (1 - (last - min) / Math.max(1, max - min)) * innerH;
    ctx.fillStyle = 'rgba(6,182,212,0.95)';
    ctx.beginPath();
    ctx.arc(lx, ly, 4 * devicePixelRatio, 0, Math.PI*2);
    ctx.fill();
  }

  // --- Jogada ---
  function jogar() {
    if (!state.running) return;
    if (state.saldo <= 0) {
      msgEl.textContent = 'Saldo 0 — reinicie para tentar de novo.';
      btnJogar.disabled = true;
      return;
    }

    const outcome = getOutcome(state.dificuldade);
    const delta = outcome.delta;
    state.saldo = clamp(state.saldo + delta, 0, 9999999);
    state.series.push(state.saldo);
    if (state.series.length > 500) state.series.shift(); // limitar memória

    const time = new Date().toLocaleTimeString();
    const entry = { time, n: outcome.n, delta, msg: outcome.text, saldoAfter: state.saldo };
    pushHistory(entry);

    // UI
    renderSaldo();
    resultadoBox.textContent = `Número: ${outcome.n} — ${outcome.text} (${delta>0?'+':''}${delta})`;
    msgEl.textContent = `Última jogada: ${time}`;
    renderHistory();
    drawChart();
    saveState();

    // If saldo for too baixo, disable jogar
    if (state.saldo <= 0) {
      msgEl.textContent = 'Você zerou o saldo. Reinicie o jogo para jogar novamente.';
      btnJogar.disabled = true;
    }
  }

  // --- Inicialização / eventos ---
  function start() {
    // ler inputs e resetar estado
    state.aposta = Math.max(1, Math.floor(Number(apostaInput.value) || 10));
    state.saldo = Math.max(1, Math.floor(Number(saldoInicialInput.value) || 100));
    state.dificuldade = dificuldadeSelect.value || 'normal';
    state.historico = [];
    state.series = [state.saldo];
    state.running = true;

    btnJogar.disabled = false;
    renderSaldo();
    renderProbabilidades();
    resultadoBox.textContent = 'Jogo iniciado — clique em Jogar!';
    msgEl.textContent = '';
    renderHistory();
    drawChart();
    saveState();
  }

  // Restore or default
  if (!loadState()) {
    state.saldo = 100;
    state.aposta = 10;
    state.series = [state.saldo];
  } else {
    // populate UI from loaded state
    saldoInicialInput.value = state.saldo;
    apostaInput.value = state.aposta;
    dificuldadeSelect.value = state.dificuldade;
    btnJogar.disabled = false;
  }
  renderSaldo();
  renderProbabilidades();
  drawChart();
  renderHistory();

  // Event listeners
  btnStart.addEventListener('click', start);
  btnJogar.addEventListener('click', () => {
    // prevent accidental multiple clicks — lightweight debounce
    btnJogar.disabled = true;
    setTimeout(() => btnJogar.disabled = false, 250);
    jogar();
  });
  btnResetHistory.addEventListener('click', () => {
    if (!confirm('Limpar histórico?')) return;
    state.historico = [];
    saveState();
    renderHistory();
  });

  // Small accessibility: Enter key triggers jogar when focused on page
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !btnJogar.disabled) {
      e.preventDefault();
      btnJogar.click();
    }
  });

  // Resize handler for chart
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawChart, 180);
  });

})();
