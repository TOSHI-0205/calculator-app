(function () {
  const mainEl = document.getElementById('mainDisplay');
  const subEl = document.getElementById('subDisplay');
  const keypad = document.getElementById('keypad');
  const calcPad = document.getElementById('calcPad');

  let display = '0';
  let previous = null;
  let pendingOp = null;
  let newEntry = true;
  let lastWasTax = false;

  function opSymbol(op) {
    if (op === '/') return '÷';
    if (op === '*') return '×';
    if (op === '-') return '−';
    if (op === '+') return '＋';
    return op;
  }

  function calculate(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function formatNum(n) {
    if (typeof n !== 'number' || !isFinite(n)) return 'エラー';
    if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-9 && n !== 0)) {
      return String(n);
    }
    var s = String(parseFloat(n.toPrecision(12)));
    if (s.length > 14) s = parseFloat(n).toExponential(6);
    return s;
  }

  function updateSub() {
    if (previous !== null && pendingOp !== null) {
      subEl.textContent = formatNum(previous) + ' ' + opSymbol(pendingOp);
    } else {
      subEl.textContent = '';
    }
  }

  function updateMain() {
    mainEl.textContent = display;
    mainEl.classList.toggle('error', display === 'エラー');
  }

  function setActiveOp(op) {
    keypad.querySelectorAll('.key-op[data-op]').forEach(function (btn) {
      btn.classList.toggle('is-active', !!(op && btn.getAttribute('data-op') === op));
    });
  }

  function digitLen(s) {
    return s.replace(/^-/, '').replace(/\./g, '').length;
  }

  function inputDigit(d) {
    if (display === 'エラー') {
      clearAll();
    }
    if (lastWasTax && newEntry) {
      subEl.textContent = '';
      lastWasTax = false;
    }
    var next;
    if (newEntry) {
      next = d;
      newEntry = false;
    } else if (display === '0') {
      next = d;
    } else {
      next = display + d;
    }
    if (digitLen(next) > 14) return;
    display = next;
    updateMain();
  }

  function inputDot() {
    if (display === 'エラー') clearAll();
    if (lastWasTax && newEntry) {
      subEl.textContent = '';
      lastWasTax = false;
    }
    if (newEntry) {
      display = '0.';
      newEntry = false;
    } else if (display.indexOf('.') === -1) {
      display += '.';
    }
    updateMain();
  }

  function inputOperator(nextOp) {
    if (display === 'エラー') return;
    lastWasTax = false;
    var cur = parseFloat(display);
    if (previous !== null && pendingOp !== null && !newEntry) {
      var r = calculate(previous, pendingOp, cur);
      if (isNaN(r)) {
        display = 'エラー';
        previous = null;
        pendingOp = null;
        newEntry = true;
        setActiveOp(null);
        updateMain();
        updateSub();
        return;
      }
      previous = r;
      display = formatNum(r);
      updateMain();
    } else {
      previous = cur;
    }
    pendingOp = nextOp;
    newEntry = true;
    setActiveOp(nextOp);
    updateSub();
  }

  function equals() {
    if (display === 'エラー') return;
    lastWasTax = false;
    if (pendingOp === null || previous === null) return;
    var cur = parseFloat(display);
    var r = calculate(previous, pendingOp, cur);
    if (isNaN(r)) {
      display = 'エラー';
      previous = null;
      pendingOp = null;
      newEntry = true;
      setActiveOp(null);
      updateMain();
      updateSub();
      return;
    }
    display = formatNum(r);
    previous = null;
    pendingOp = null;
    newEntry = true;
    setActiveOp(null);
    updateMain();
    updateSub();
  }

  function clearAll() {
    display = '0';
    previous = null;
    pendingOp = null;
    newEntry = true;
    lastWasTax = false;
    setActiveOp(null);
    updateMain();
    updateSub();
  }

  function applyTax(rate) {
    if (display === 'エラー') return;
    var base = parseFloat(display);
    if (!isFinite(base)) return;
    var inc = base * (1 + rate / 100);
    var formatted = formatNum(inc);
    if (formatted === 'エラー') {
      display = 'エラー';
    } else {
      display = formatted;
    }
    subEl.textContent = '税抜 ' + formatNum(base) + ' · ' + rate + '% → 税込';
    previous = null;
    pendingOp = null;
    newEntry = true;
    lastWasTax = true;
    setActiveOp(null);
    updateMain();
  }

  function toggleSign() {
    if (display === 'エラー') return;
    if (lastWasTax) {
      subEl.textContent = '';
      lastWasTax = false;
    }
    if (display === '0') return;
    if (display.charAt(0) === '-') display = display.slice(1);
    else display = '-' + display;
    newEntry = false;
    updateMain();
  }

  function percent() {
    if (display === 'エラー') return;
    if (lastWasTax) {
      subEl.textContent = '';
      lastWasTax = false;
    }
    var v = parseFloat(display);
    display = formatNum(v / 100);
    newEntry = true;
    updateMain();
  }

  calcPad.addEventListener('click', function (e) {
    var btn = e.target.closest('.key');
    if (!btn) return;

    if (btn.hasAttribute('data-digit')) {
      inputDigit(btn.getAttribute('data-digit'));
      return;
    }

    var action = btn.getAttribute('data-action');
    if (action === 'dot') {
      inputDot();
      return;
    }
    if (action === 'clear') {
      clearAll();
      return;
    }
    if (action === 'sign') {
      toggleSign();
      return;
    }
    if (action === 'percent') {
      percent();
      return;
    }
    if (action === 'equals') {
      equals();
      return;
    }
    if (action === 'tax') {
      var rate = parseInt(btn.getAttribute('data-rate'), 10);
      if (rate === 8 || rate === 10) {
        applyTax(rate);
      }
      return;
    }

    var op = btn.getAttribute('data-op');
    if (op) {
      inputOperator(op);
    }
  });

  updateMain();
  updateSub();
})();
