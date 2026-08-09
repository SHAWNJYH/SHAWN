/* ============================================================
   Function-Calculator.js
   공용 계산기 모듈 (로그인 메뉴 / EGMM(ODP) / 추후 H-MART 공통)
   - window.FunctionCalc.fmt(n) / wire(cfg)
   - wire() 호출마다 독립된 상태(state)를 가진 계산기를 만듭니다.
   cfg 예시:
     로그인:  { keysSelector:'#calcScreen .calc-grid', keyClass:'calc-key',
               expr:'calcExpr', result:'calcResult',
               keyboardActiveSelector:'#calcScreen' }
     ODP:    { keysId:'odCalcKeys', keyClass:'odp-ckey',
               expr:'odCalcExpr', result:'odCalcRes' }
   keyboardActiveSelector 가 있으면, 해당 요소에 'active' 클래스가 있을 때만
   키보드 입력을 받습니다(없으면 키보드 입력 미사용).
   ============================================================ */
(function () {
  'use strict';

  var OPS = { add: '+', sub: '−', mul: '×', div: '÷' };
  var $ = function (id) { return document.getElementById(id); };

  // 부동소수점 오차 정리 + 보기 좋은 포맷
  function fmt(n) {
    if (!isFinite(n)) return '오류';
    if (n === 0) return '0';
    var r = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
    var s = String(r);
    if (s.replace('-', '').replace('.', '').length > 14) s = String(Number(r.toPrecision(12)));
    return s;
  }
  function compute(a, b, op) {
    if (op === 'add') return a + b;
    if (op === 'sub') return a - b;
    if (op === 'mul') return a * b;
    if (op === 'div') return b === 0 ? NaN : a / b;
    return b;
  }

  function wire(cfg) {
    cfg = cfg || {};
    var keysEl = cfg.keysSelector ? document.querySelector(cfg.keysSelector)
               : (cfg.keysId ? $(cfg.keysId) : null);
    var resEl = $(cfg.result);
    var exprEl = cfg.expr ? $(cfg.expr) : null;
    if (!keysEl || !resEl) return null;
    var keyClass = cfg.keyClass || 'calc-key';

    var st = { cur: '0', first: null, op: null, waiting: false };

    function render() {
      resEl.textContent = st.cur;
      if (exprEl) exprEl.textContent = (st.first != null && st.op) ? (fmt(st.first) + ' ' + OPS[st.op]) : '';
      var ops = keysEl.querySelectorAll('.' + keyClass + '.op');
      Array.prototype.forEach.call(ops, function (b) {
        b.classList.toggle('active', !!(st.op && b.dataset.k === st.op && st.waiting));
      });
    }

    function handle(k) {
      if (st.cur === '오류' && !/^[0-9]$/.test(k) && k !== 'ac' && k !== 'dot') {
        if (k === 'ac') { st.cur = '0'; st.first = null; st.op = null; st.waiting = false; render(); }
        return;
      }
      if (/^[0-9]$/.test(k)) {
        if (st.cur === '오류') { st.cur = k; st.waiting = false; }
        else if (st.waiting) { st.cur = k; st.waiting = false; }
        else st.cur = (st.cur === '0') ? k : st.cur + k;
      } else if (k === 'dot') {
        if (st.cur === '오류' || st.waiting) { st.cur = '0.'; st.waiting = false; }
        else if (st.cur.indexOf('.') === -1) st.cur += '.';
      } else if (OPS[k]) {
        var v = parseFloat(st.cur) || 0;
        if (st.op && !st.waiting) { var r = compute(st.first, v, st.op); st.cur = fmt(r); st.first = isFinite(r) ? r : null; }
        else st.first = v;
        st.op = k; st.waiting = true;
      } else if (k === 'eq') {
        if (st.op != null && st.first != null) {
          var r2 = compute(st.first, parseFloat(st.cur) || 0, st.op);
          st.cur = fmt(r2); st.first = null; st.op = null; st.waiting = true;
        }
      } else if (k === 'ac') { st.cur = '0'; st.first = null; st.op = null; st.waiting = false; }
      else if (k === 'back') {
        if (!(st.waiting || st.cur === '오류')) { st.cur = st.cur.length > 1 ? st.cur.slice(0, -1) : '0'; if (st.cur === '-') st.cur = '0'; }
      } else if (k === 'pct') { var p = parseFloat(st.cur); if (!isNaN(p)) st.cur = fmt(p / 100); }
      else if (k === 'sign') { if (st.cur !== '0' && st.cur !== '오류') st.cur = st.cur.charAt(0) === '-' ? st.cur.slice(1) : '-' + st.cur; }
      render();
    }

    keysEl.addEventListener('click', function (e) {
      var b = e.target.closest('.' + keyClass);
      if (!b) return;
      handle(b.dataset.k);
    });

    if (cfg.keyboardActiveSelector) {
      document.addEventListener('keydown', function (e) {
        var gate = document.querySelector(cfg.keyboardActiveSelector);
        if (!gate || !gate.classList.contains('active')) return;
        var k = e.key;
        if (/^[0-9]$/.test(k)) handle(k);
        else if (k === '.') handle('dot');
        else if (k === '+') handle('add');
        else if (k === '-') handle('sub');
        else if (k === '*') handle('mul');
        else if (k === '/') { e.preventDefault(); handle('div'); }
        else if (k === 'Enter' || k === '=') { e.preventDefault(); handle('eq'); }
        else if (k === 'Backspace') handle('back');
        else if (k === 'Escape') handle('ac');
        else if (k === '%') handle('pct');
      });
    }

    render();
    return { handle: handle };
  }

  window.FunctionCalc = { fmt: fmt, wire: wire };
})();
