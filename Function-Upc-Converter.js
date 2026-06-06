/* ============================================================
   Function-Upc-Converter.js
   공용 UPC 변환 모듈 (로그인 메뉴 / EGMM(ODP) / 추후 H-MART 공통)
   - window.FunctionUpc.convert(rawCode) : 순수 변환 함수
   - window.FunctionUpc.wire(cfg)        : 화면 요소(id)에 동작 연결
   cfg 예시:
     { input, output, convertBtn, pasteBtn, copyBtn,
       clearInputBtn, clearOutputBtn, clearBothBtn,
       inputStatus, outputStatus }
   없는 요소는 자동으로 건너뜁니다(디자인이 달라도 그대로 사용 가능).
   ============================================================ */
(function () {
  'use strict';

  // UPC-E(8자리) → UPC-A(11자리) 확장
  function expandE(u) {
    var ns = u.charAt(0), x1 = u.charAt(1), x2 = u.charAt(2),
        x3 = u.charAt(3), x4 = u.charAt(4), x5 = u.charAt(5), x6 = u.charAt(6);
    // 8번째 자리(charAt(7))는 체크디짓이므로 무시
    var man, prod;
    if (x6 === '0' || x6 === '1' || x6 === '2') { man = x1 + x2 + x6 + '00'; prod = '00' + x3 + x4 + x5; }
    else if (x6 === '3') { man = x1 + x2 + x3 + '00'; prod = '000' + x4 + x5; }
    else if (x6 === '4') { man = x1 + x2 + x3 + x4 + '0'; prod = '0000' + x5; }
    else { man = x1 + x2 + x3 + x4 + x5; prod = '0000' + x6; }
    return ns + man + prod;
  }

  // 메인 변환 함수
  function convert(rawCode) {
    var code = '';
    for (var i = 0; i < rawCode.length; i++) {
      var ch = rawCode.charAt(i);
      if (ch >= '0' && ch <= '9') code += ch;
    }
    if (code === '') return '';
    var n = code.length;
    if (n >= 14) return code; // 128 등 긴 코드는 그대로
    switch (n) {
      case 8:  return code.charAt(0) === '0' ? expandE(code) : code.substring(0, 7);
      case 12: return code.substring(0, 11);
      case 13: return code.substring(0, 12);
      case 10:
      case 11: {
        var t = code;
        if (t.charAt(0) === '0') t = t.substring(1);
        return t.length > 1 ? t.substring(0, t.length - 1) : t;
      }
      default: return code;
    }
  }

  var $ = function (id) { return document.getElementById(id); };
  function toast(msg, type) { if (window.showToast) window.showToast(msg, type); }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    toast('✅ 결과가 모두 복사되었습니다!', 'success');
  }
  function copyOut(text) {
    if (!text) { toast('복사할 내용이 없습니다', 'error'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { toast('✅ 결과가 모두 복사되었습니다!', 'success'); })
        .catch(function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }

  function countLines(text) {
    return text.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; }).length;
  }

  function wire(cfg) {
    cfg = cfg || {};
    var input = $(cfg.input), output = $(cfg.output);
    if (!input || !output) return null;

    function updateInStatus() {
      if (cfg.inputStatus && $(cfg.inputStatus)) $(cfg.inputStatus).textContent = countLines(input.value) + '줄';
    }
    function updateOutStatus() {
      if (cfg.outputStatus && $(cfg.outputStatus)) $(cfg.outputStatus).textContent = countLines(output.value) + '줄';
    }
    function doConvert() {
      if (!input.value.trim()) { toast('변환할 내용을 입력하세요', 'error'); input.focus(); return; }
      var results = input.value.split(/\r?\n/).map(function (l) { return convert(l); });
      output.value = results.join('\n');
      updateOutStatus();
      var nonEmpty = results.filter(function (r) { return r !== ''; }).length;
      toast('✅ ' + nonEmpty + '개 변환 완료!', 'success');
    }

    if (cfg.convertBtn && $(cfg.convertBtn)) $(cfg.convertBtn).onclick = doConvert;

    input.addEventListener('input', updateInStatus);
    input.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doConvert(); }
    });

    if (cfg.clearInputBtn && $(cfg.clearInputBtn))
      $(cfg.clearInputBtn).onclick = function () { input.value = ''; updateInStatus(); input.focus(); };
    if (cfg.clearOutputBtn && $(cfg.clearOutputBtn))
      $(cfg.clearOutputBtn).onclick = function () { output.value = ''; updateOutStatus(); };
    if (cfg.clearBothBtn && $(cfg.clearBothBtn))
      $(cfg.clearBothBtn).onclick = function () { input.value = ''; output.value = ''; updateInStatus(); updateOutStatus(); input.focus(); };
    if (cfg.copyBtn && $(cfg.copyBtn))
      $(cfg.copyBtn).onclick = function () { copyOut(output.value); };
    if (cfg.pasteBtn && $(cfg.pasteBtn))
      $(cfg.pasteBtn).onclick = function () {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText()
            .then(function (t) { input.value = t; updateInStatus(); toast('붙여넣기 완료', 'success'); })
            .catch(function () { toast('직접 Ctrl+V 로 붙여넣어 주세요', 'error'); });
        } else { toast('직접 Ctrl+V 로 붙여넣어 주세요', 'error'); }
      };

    updateInStatus();
    updateOutStatus();
    return { convert: doConvert };
  }

  window.FunctionUpc = { convert: convert, wire: wire };
})();
