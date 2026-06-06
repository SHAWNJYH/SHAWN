/* ============================================================
   Function-Case-Converter.js
   공용 대소문자 변환 모듈 (로그인 메뉴 / EGMM(ODP) / 추후 H-MART 공통)
   - window.FunctionCase.toUpper/toLower/toTitle(text) : 순수 함수
   - window.FunctionCase.wire(cfg)                     : 화면 요소(id) 연결
   cfg 예시:
     { input, output, upperBtn, lowerBtn, titleBtn,
       copyBtn, pasteBtn, clearInputBtn, clearOutputBtn,
       inputStatus, outputStatus }
   없는 요소는 자동으로 건너뜁니다.
   ============================================================ */
(function () {
  'use strict';

  function toUpper(t) { return t.toUpperCase(); }
  function toLower(t) { return t.toLowerCase(); }
  function toTitle(t) { return t.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  var $ = function (id) { return document.getElementById(id); };
  function toast(msg, type) { if (window.showToast) window.showToast(msg, type); }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    toast('✅ 복사되었습니다!', 'success');
  }
  function copyOut(text) {
    if (!text) { toast('복사할 내용이 없습니다', 'error'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { toast('✅ 복사되었습니다!', 'success'); })
        .catch(function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }

  function wire(cfg) {
    cfg = cfg || {};
    var input = $(cfg.input), output = $(cfg.output);
    if (!input || !output) return null;

    function updateIn() {
      if (cfg.inputStatus && $(cfg.inputStatus)) $(cfg.inputStatus).textContent = input.value.length + '자';
    }
    function updateOut() {
      if (cfg.outputStatus && $(cfg.outputStatus)) $(cfg.outputStatus).textContent = output.value.length + '자';
    }
    function convert(mode) {
      if (!input.value.trim()) { toast('변환할 텍스트를 입력하세요', 'error'); input.focus(); return; }
      var result, label;
      if (mode === 'upper') { result = toUpper(input.value); label = '전부 대문자'; }
      else if (mode === 'lower') { result = toLower(input.value); label = '전부 소문자'; }
      else { result = toTitle(input.value); label = '첫글자 대문자'; }
      output.value = result;
      updateOut();
      toast('✅ ' + label + ' 변환 완료!', 'success');
    }

    if (cfg.upperBtn && $(cfg.upperBtn)) $(cfg.upperBtn).onclick = function () { convert('upper'); };
    if (cfg.lowerBtn && $(cfg.lowerBtn)) $(cfg.lowerBtn).onclick = function () { convert('lower'); };
    if (cfg.titleBtn && $(cfg.titleBtn)) $(cfg.titleBtn).onclick = function () { convert('title'); };

    input.addEventListener('input', updateIn);

    if (cfg.clearInputBtn && $(cfg.clearInputBtn))
      $(cfg.clearInputBtn).onclick = function () { input.value = ''; updateIn(); input.focus(); };
    if (cfg.clearOutputBtn && $(cfg.clearOutputBtn))
      $(cfg.clearOutputBtn).onclick = function () { output.value = ''; updateOut(); };
    if (cfg.copyBtn && $(cfg.copyBtn))
      $(cfg.copyBtn).onclick = function () { copyOut(output.value); };
    if (cfg.pasteBtn && $(cfg.pasteBtn))
      $(cfg.pasteBtn).onclick = function () {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText()
            .then(function (t) { input.value = t; updateIn(); toast('붙여넣기 완료', 'success'); })
            .catch(function () { toast('직접 Ctrl+V 로 붙여넣어 주세요', 'error'); });
        } else { toast('직접 Ctrl+V 로 붙여넣어 주세요', 'error'); }
      };

    updateIn();
    updateOut();
    return { convert: convert };
  }

  window.FunctionCase = { toUpper: toUpper, toLower: toLower, toTitle: toTitle, wire: wire };
})();
