/* ============================================================
   Function-Unit-Converter.js
   공용 용량/무게 변환 모듈 (로그인 메뉴 / EGMM(ODP) / 추후 H-MART 공통)
   - 모든 단위를 그램(g) 기준으로 환산 (물 기준 1 mL = 1 g, 1 L = 1000 g)
   - 리터(L) 포함 (ODP 작업용 기준)
   - window.FunctionUnit.TO_GRAM / fmt(x) / wire(cfg)
   cfg 예시:
     { fields: { oz:'id', floz:'id', g:'id', kg:'id', ml:'id', l:'id', lb:'id' },
       clearBtn:'id', focusUnit:'oz' }
   fields 에 넣은 단위 중 실제 존재하는 요소만 연결합니다.
   (예: 로그인 화면은 리터 칸이 없어도 그대로 동작)
   ============================================================ */
(function () {
  'use strict';

  var TO_GRAM = { oz: 28.349523125, g: 1, kg: 1000, lb: 453.59237, ml: 1, l: 1000, floz: 29.5735295625 };
  var $ = function (id) { return document.getElementById(id); };

  // 보기 좋게 숫자 포맷 (소수점 2자리 반올림, 불필요한 0 제거)
  function fmt(x) {
    if (!isFinite(x)) return '';
    if (x === 0) return '0';
    var r = Math.round(x * 100) / 100;
    var s = String(r);
    if (s.indexOf('e') !== -1 || s.indexOf('E') !== -1) s = r.toFixed(2).replace(/\.?0+$/, '');
    return s;
  }

  function wire(cfg) {
    cfg = cfg || {};
    var fields = cfg.fields || {};
    // 실제로 존재하는 단위만 사용
    var units = Object.keys(fields).filter(function (u) { return $(fields[u]); });
    if (units.length === 0) return null;

    function clearOthers(src) {
      units.forEach(function (u) { if (u !== src) $(fields[u]).value = ''; });
    }
    function recompute(src) {
      var raw = $(fields[src]).value.trim();
      if (raw === '') { clearOthers(src); return; }
      var val = parseFloat(raw);
      if (isNaN(val)) { clearOthers(src); return; }
      var grams = val * TO_GRAM[src];
      units.forEach(function (u) { if (u !== src) $(fields[u]).value = fmt(grams / TO_GRAM[u]); });
    }

    units.forEach(function (u) {
      $(fields[u]).addEventListener('input', function () { recompute(u); });
    });

    if (cfg.clearBtn && $(cfg.clearBtn)) {
      $(cfg.clearBtn).onclick = function () {
        units.forEach(function (u) { $(fields[u]).value = ''; });
        var fid = (cfg.focusUnit && fields[cfg.focusUnit]) ? fields[cfg.focusUnit] : fields[units[0]];
        if ($(fid)) $(fid).focus();
      };
    }

    return { recompute: recompute };
  }

  window.FunctionUnit = { TO_GRAM: TO_GRAM, fmt: fmt, wire: wire };
})();
