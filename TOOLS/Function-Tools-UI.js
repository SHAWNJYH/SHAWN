/* ============================================================
   Function-Tools-UI.js
   공용 도구 UI 팩토리 (계산기 / 대소문자 / 용량변환 / UPC변환)
   - 로직은 기존 모듈(FunctionCalc / FunctionCase / FunctionUnit / FunctionUpc)을
     그대로 사용하고, 이 모듈은 화면(마크업+CSS)만 생성합니다.
   - 크기 2종: 'lg'(큰 화면) / 'sm'(작은 화면) — CSS 변수로만 차이를 내므로
     mount 후 setSize()로 즉시 전환 가능(재바인딩 불필요).

   사용법:
     var h = FunctionToolsUI.mount('컨테이너id 또는 요소', {
       tool : 'calc' | 'case' | 'unit' | 'upc',
       size : 'lg' | 'sm',          // 기본 'lg'
       title: '제목(생략 시 기본값)',
       keyboardActiveSelector: '...' // calc 전용(선택)
     });
     h.setSize('sm');   // 크기 전환
     h.api              // 기존 모듈 wire() 반환값
     h.root             // 생성된 카드 요소 (제거: h.destroy())

   의존: Function-Calculator.js, Function-Case-Converter.js,
         Function-Unit-Converter.js, Function-Upc-Converter.js
         (사용하는 도구의 모듈만 로드되어 있으면 됩니다)
   ============================================================ */
(function () {
  'use strict';

  var SEQ = 0;
  var CSS_ID = 'ftw-style';

  /* ---------- 공용 토스트(페이지에 showToast 가 없을 때만 제공) ---------- */
  if (!window.showToast) {
    window.showToast = function (msg, type) {
      var t = document.createElement('div');
      t.className = 'ftw-toast' + (type === 'error' ? ' err' : '');
      t.textContent = msg;
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('show'); });
      setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
      }, 1800);
    };
  }

  /* ---------- 스타일(1회 주입) ---------- */
  function injectCss() {
    if (document.getElementById(CSS_ID)) return;
    var css = ''
    + '.ftw{'
    +   '--ftw-gold:#c9a961; --ftw-gold-d:#b08d3f;'
    +   '--ftw-ink:#1f2430; --ftw-sub:#6b7280; --ftw-line:#e5e7eb; --ftw-bg:#ffffff; --ftw-bg2:#f6f7f9;'
    +   '--fs:14px; --fs-sm:12px; --pad:16px; --gap:10px; --rad:16px; --rad-in:11px;'
    +   '--keyh:50px; --key-fs:17px; --res-fs:30px; --btn-h:38px; --tah:150px; --field-h:38px;'
    +   'font-family:"Pretendard",-apple-system,"Malgun Gothic",sans-serif; font-size:var(--fs); color:var(--ftw-ink);'
    +   'width:100%; box-sizing:border-box; }'
    + '.ftw *{ box-sizing:border-box; font-family:inherit; }'
    + '.ftw.ftw-sm{'
    +   '--fs:12px; --fs-sm:10.5px; --pad:10px; --gap:6px; --rad:12px; --rad-in:8px;'
    +   '--keyh:33px; --key-fs:13px; --res-fs:20px; --btn-h:28px; --tah:82px; --field-h:29px; }'

    /* 카드 */
    + '.ftw-card{ background:var(--ftw-bg); border:1px solid var(--ftw-line); border-radius:var(--rad);'
    +   'overflow:hidden; box-shadow:0 8px 26px rgba(15,20,40,.07); display:flex; flex-direction:column; }'
    + '.ftw-head{ display:flex; align-items:center; gap:8px; padding:calc(var(--pad)*.62) var(--pad);'
    +   'background:linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%); }'
    + '.ftw-head .tick{ width:4px; height:1.05em; border-radius:2px; background:var(--ftw-gold); flex:none; }'
    + '.ftw-tt{ color:#fff; font-weight:700; font-size:calc(var(--fs) + 1px); letter-spacing:.02em; }'
    + '.ftw-body{ padding:var(--pad); display:flex; flex-direction:column; gap:var(--gap); }'

    /* 공용 버튼/입력 */
    + '.ftw-btn{ height:var(--btn-h); padding:0 calc(var(--pad)*.8); border:1px solid var(--ftw-line);'
    +   'border-radius:var(--rad-in); background:var(--ftw-bg2); color:var(--ftw-ink); font-size:var(--fs);'
    +   'font-weight:600; cursor:pointer; transition:background .13s, transform .08s; white-space:nowrap; }'
    + '.ftw-btn:hover{ background:#eef0f3; } .ftw-btn:active{ transform:scale(.97); }'
    + '.ftw-btn.gold{ background:linear-gradient(135deg,var(--ftw-gold),var(--ftw-gold-d)); color:#fff; border:0; }'
    + '.ftw-btn.gold:hover{ filter:brightness(1.06); }'
    + '.ftw-btn.ghost{ background:transparent; }'
    + '.ftw-row{ display:flex; gap:var(--gap); flex-wrap:wrap; }'
    + '.ftw-row .grow{ flex:1; }'
    + '.ftw-ta{ width:100%; height:var(--tah); resize:vertical; border:1px solid var(--ftw-line);'
    +   'border-radius:var(--rad-in); padding:calc(var(--pad)*.6); font-size:var(--fs); line-height:1.5;'
    +   'background:var(--ftw-bg2); color:var(--ftw-ink); outline:none; }'
    + '.ftw-ta:focus{ border-color:var(--ftw-gold); background:#fff; box-shadow:0 0 0 3px rgba(201,169,97,.15); }'
    + '.ftw-lbl{ display:flex; align-items:center; justify-content:space-between; font-size:var(--fs-sm);'
    +   'color:var(--ftw-sub); font-weight:600; letter-spacing:.02em; }'
    + '.ftw-lbl .st{ font-weight:500; color:var(--ftw-gold-d); }'

    /* 계산기 */
    + '.ftw-calc-scr{ background:linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%); border-radius:var(--rad-in);'
    +   'padding:calc(var(--pad)*.7) var(--pad); text-align:right; }'
    + '.ftw-calc-expr{ min-height:1.2em; color:rgba(255,255,255,.55); font-size:var(--fs-sm); }'
    + '.ftw-calc-res{ color:#fff; font-size:var(--res-fs); font-weight:700; line-height:1.15;'
    +   'overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
    + '.ftw-calc-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:var(--gap); }'
    + '.ftw-ckey{ height:var(--keyh); border:0; border-radius:var(--rad-in); font-size:var(--key-fs); font-weight:600;'
    +   'background:var(--ftw-bg2); color:var(--ftw-ink); cursor:pointer; transition:background .12s, transform .07s; }'
    + '.ftw-ckey:hover{ background:#eceef2; } .ftw-ckey:active{ transform:scale(.95); }'
    + '.ftw-ckey.fn{ background:#e8eaef; color:#3a4150; }'
    + '.ftw-ckey.op{ background:linear-gradient(135deg,var(--ftw-gold),var(--ftw-gold-d)); color:#fff; }'
    + '.ftw-ckey.op.active{ background:#fff; color:var(--ftw-gold-d); box-shadow:inset 0 0 0 2px var(--ftw-gold); }'
    + '.ftw-ckey.eq{ background:linear-gradient(135deg,#2d2d44,#1a1a2e); color:var(--ftw-gold); }'
    + '.ftw-ckey.zero{ grid-column:span 1; }'

    /* 용량/무게 변환 */
    + '.ftw-unit-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:var(--gap); }'
    + '.ftw-unit{ display:flex; align-items:center; border:1px solid var(--ftw-line); border-radius:var(--rad-in);'
    +   'background:var(--ftw-bg2); overflow:hidden; }'
    + '.ftw-unit:focus-within{ border-color:var(--ftw-gold); background:#fff; box-shadow:0 0 0 3px rgba(201,169,97,.15); }'
    + '.ftw-unit input{ flex:1; min-width:0; height:var(--field-h); border:0; background:transparent; outline:none;'
    +   'padding:0 calc(var(--pad)*.55); font-size:var(--fs); color:var(--ftw-ink); text-align:right; }'
    + '.ftw-unit .u{ flex:none; width:3.4em; text-align:center; font-size:var(--fs-sm); font-weight:700;'
    +   'color:var(--ftw-gold-d); background:rgba(201,169,97,.12); align-self:stretch; display:flex;'
    +   'align-items:center; justify-content:center; border-left:1px solid var(--ftw-line); }'

    /* 토스트 */
    + '.ftw-toast{ position:fixed; left:50%; bottom:28px; transform:translateX(-50%) translateY(8px); z-index:9999;'
    +   'background:rgba(26,26,46,.94); color:#fff; font-size:13px; font-weight:600; padding:9px 18px;'
    +   'border-radius:22px; box-shadow:0 10px 30px rgba(0,0,0,.28); opacity:0; transition:opacity .2s, transform .2s;'
    +   'font-family:"Pretendard",-apple-system,sans-serif; pointer-events:none; }'
    + '.ftw-toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }'
    + '.ftw-toast.err{ background:rgba(190,50,50,.95); }';
    var st = document.createElement('style');
    st.id = CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- 도구별 마크업 + 기존 모듈 연결 ---------- */

  function buildCalc(body, uid, opt) {
    body.innerHTML =
      '<div class="ftw-calc-scr"><div class="ftw-calc-expr" id="' + uid + '-expr"></div>' +
      '<div class="ftw-calc-res" id="' + uid + '-res">0</div></div>' +
      '<div class="ftw-calc-grid" id="' + uid + '-keys">' +
        key('ac', 'AC', 'fn') + key('back', '⌫', 'fn') + key('pct', '%', 'fn') + key('div', '÷', 'op') +
        key('7', '7') + key('8', '8') + key('9', '9') + key('mul', '×', 'op') +
        key('4', '4') + key('5', '5') + key('6', '6') + key('sub', '−', 'op') +
        key('1', '1') + key('2', '2') + key('3', '3') + key('add', '+', 'op') +
        key('sign', '±', 'fn') + key('0', '0', 'zero') + key('dot', '.') + key('eq', '=', 'eq') +
      '</div>';
    function key(k, label, extra) {
      return '<button class="ftw-ckey' + (extra ? ' ' + extra : '') + '" data-k="' + k + '">' + label + '</button>';
    }
    if (!window.FunctionCalc) return null;
    return window.FunctionCalc.wire({
      keysId: uid + '-keys', keyClass: 'ftw-ckey',
      expr: uid + '-expr', result: uid + '-res',
      keyboardActiveSelector: opt.keyboardActiveSelector || null
    });
  }

  function buildCase(body, uid) {
    body.innerHTML =
      '<div class="ftw-lbl"><span>입력</span><span class="st" id="' + uid + '-ist">0자</span></div>' +
      '<textarea class="ftw-ta" id="' + uid + '-in" placeholder="변환할 텍스트를 입력하세요"></textarea>' +
      '<div class="ftw-row">' +
        '<button class="ftw-btn gold grow" id="' + uid + '-up">대문자</button>' +
        '<button class="ftw-btn gold grow" id="' + uid + '-low">소문자</button>' +
        '<button class="ftw-btn gold grow" id="' + uid + '-tit">첫글자 대문자</button>' +
      '</div>' +
      '<div class="ftw-lbl"><span>결과</span><span class="st" id="' + uid + '-ost">0자</span></div>' +
      '<textarea class="ftw-ta" id="' + uid + '-out" placeholder="변환 결과" readonly></textarea>' +
      '<div class="ftw-row">' +
        '<button class="ftw-btn" id="' + uid + '-paste">붙여넣기</button>' +
        '<button class="ftw-btn" id="' + uid + '-copy">결과 복사</button>' +
        '<span class="grow"></span>' +
        '<button class="ftw-btn ghost" id="' + uid + '-cin">입력 지우기</button>' +
        '<button class="ftw-btn ghost" id="' + uid + '-cout">결과 지우기</button>' +
      '</div>';
    if (!window.FunctionCase) return null;
    return window.FunctionCase.wire({
      input: uid + '-in', output: uid + '-out',
      upperBtn: uid + '-up', lowerBtn: uid + '-low', titleBtn: uid + '-tit',
      copyBtn: uid + '-copy', pasteBtn: uid + '-paste',
      clearInputBtn: uid + '-cin', clearOutputBtn: uid + '-cout',
      inputStatus: uid + '-ist', outputStatus: uid + '-ost'
    });
  }

  var UNIT_DEFS = [
    ['oz', 'oz'], ['floz', 'fl oz'], ['lb', 'lb'], ['g', 'g'], ['kg', 'kg'], ['ml', 'mL'], ['l', 'L']
  ];
  function buildUnit(body, uid) {
    var grid = UNIT_DEFS.map(function (d) {
      return '<div class="ftw-unit"><input type="number" step="any" id="' + uid + '-' + d[0] + '" placeholder="0">' +
             '<span class="u">' + d[1] + '</span></div>';
    }).join('');
    body.innerHTML =
      '<div class="ftw-lbl"><span>아무 칸에나 입력하면 나머지가 자동 환산됩니다 (물 기준 1mL=1g)</span></div>' +
      '<div class="ftw-unit-grid">' + grid + '</div>' +
      '<div class="ftw-row"><button class="ftw-btn grow" id="' + uid + '-clear">전체 지우기</button></div>';
    if (!window.FunctionUnit) return null;
    var fields = {};
    UNIT_DEFS.forEach(function (d) { fields[d[0]] = uid + '-' + d[0]; });
    return window.FunctionUnit.wire({ fields: fields, clearBtn: uid + '-clear', focusUnit: 'oz' });
  }

  function buildUpc(body, uid) {
    body.innerHTML =
      '<div class="ftw-lbl"><span>입력 (여러 줄 가능 · Ctrl+Enter 변환)</span><span class="st" id="' + uid + '-ist">0줄</span></div>' +
      '<textarea class="ftw-ta" id="' + uid + '-in" placeholder="변환할 UPC를 줄마다 입력"></textarea>' +
      '<div class="ftw-row">' +
        '<button class="ftw-btn" id="' + uid + '-paste">붙여넣기</button>' +
        '<button class="ftw-btn gold grow" id="' + uid + '-conv">UPC 변환</button>' +
      '</div>' +
      '<div class="ftw-lbl"><span>결과</span><span class="st" id="' + uid + '-ost">0줄</span></div>' +
      '<textarea class="ftw-ta" id="' + uid + '-out" placeholder="변환 결과" readonly></textarea>' +
      '<div class="ftw-row">' +
        '<button class="ftw-btn" id="' + uid + '-copy">결과 복사</button>' +
        '<span class="grow"></span>' +
        '<button class="ftw-btn ghost" id="' + uid + '-cboth">모두 지우기</button>' +
      '</div>';
    if (!window.FunctionUpc) return null;
    return window.FunctionUpc.wire({
      input: uid + '-in', output: uid + '-out',
      convertBtn: uid + '-conv', pasteBtn: uid + '-paste', copyBtn: uid + '-copy',
      clearBothBtn: uid + '-cboth',
      inputStatus: uid + '-ist', outputStatus: uid + '-ost'
    });
  }

  var TOOLS = {
    calc: { title: '계산기',        build: buildCalc },
    'case': { title: '대소문자 변환', build: buildCase },
    unit: { title: '용량·무게 변환',  build: buildUnit },
    upc:  { title: 'UPC 변환',       build: buildUpc }
  };

  /* ---------- mount ---------- */
  function mount(target, opt) {
    opt = opt || {};
    var def = TOOLS[opt.tool];
    if (!def) { console.warn('[FunctionToolsUI] 알 수 없는 tool:', opt.tool); return null; }
    var host = (typeof target === 'string') ? $(target) : target;
    if (!host) { console.warn('[FunctionToolsUI] 컨테이너를 찾을 수 없습니다:', target); return null; }
    injectCss();

    var uid = 'ftw-' + opt.tool + '-' + (++SEQ);
    var size = (opt.size === 'sm') ? 'sm' : 'lg';

    var root = el('div', 'ftw ftw-' + size);
    var card = el('div', 'ftw-card');
    var head = el('div', 'ftw-head',
      '<span class="tick"></span><span class="ftw-tt">' + (opt.title || def.title) + '</span>');
    var body = el('div', 'ftw-body');
    card.appendChild(head); card.appendChild(body); root.appendChild(card);
    host.appendChild(root);

    var api = def.build(body, uid, opt);
    if (!api) console.warn('[FunctionToolsUI] "' + opt.tool + '" 로직 모듈이 로드되지 않았습니다.');

    return {
      root: root,
      api: api,
      uid: uid,
      setSize: function (s) {
        root.classList.remove('ftw-lg', 'ftw-sm');
        root.classList.add(s === 'sm' ? 'ftw-sm' : 'ftw-lg');
      },
      destroy: function () { if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  window.FunctionToolsUI = { mount: mount, TOOLS: Object.keys(TOOLS) };
})();
