// ─── 日付自動補完 ─────────────────────────────
// 対応フォーマット:
//   "2/10"       → 今年 or 来年の "2026/2/10"
//   "2/10/26"    → "2026/2/10"
//   "26/2/10"    → "2026/2/10"
//   "2026/2/10"  → そのまま
//   "2026-2-10"  → "2026/2/10"
//   "20260210"   → "2026/2/10"

function parseDate(raw) {
  const s = raw.trim().replace(/　/g, '').replace(/-/g, '/');

  // 8桁数字: 20260210
  if (/^\d{8}$/.test(s)) {
    const y = parseInt(s.slice(0, 4));
    const m = parseInt(s.slice(4, 6));
    const d = parseInt(s.slice(6, 8));
    return buildDate(y, m, d);
  }

  const parts = s.split('/').map(p => p.trim());

  if (parts.length === 2) {
    // M/D → 常に今年
    const [m, d] = parts.map(Number);
    const y = new Date().getFullYear();
    return buildDate(y, m, d);
  }

  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) {
      // 2026/2/10
      return buildDate(Number(a), Number(b), Number(c));
    } else if (c.length === 4) {
      // 2/10/2026
      return buildDate(Number(c), Number(a), Number(b));
    } else {
      // 2桁年: 26/2/10 or 2/10/26
      if (Number(a) > 12) {
        return buildDate(2000 + Number(a), Number(b), Number(c));
      } else {
        return buildDate(2000 + Number(c), Number(a), Number(b));
      }
    }
  }

  return null;
}

function buildDate(y, m, d) {
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}/${m}/${d}`;
}

function attachDateFormatter(inputId, errId) {
  const input = document.getElementById(inputId);
  input.addEventListener('blur', () => {
    const raw = input.value.trim();
    if (!raw) return;
    const formatted = parseDate(raw);
    if (formatted) {
      input.value = formatted;
      input.classList.remove('is-error');
      document.getElementById(errId).textContent = '';
    } else {
      input.classList.add('is-error');
      document.getElementById(errId).textContent = '日付の形式が正しくありません。例）2/10　または　2026/2/10';
    }
  });
}

attachDateFormatter('orderDate', 'err-orderDate');
attachDateFormatter('dueDate',   'err-dueDate');


// ─── バリデーション ───────────────────────────
const fields = [
  { id: 'projectNo', label: '工事番号' },
  { id: 'drawingNo', label: '図面番号' },
  { id: 'vendor',    label: '発注先'   },
  { id: 'orderDate', label: '発注日'   },
  { id: 'dueDate',   label: '納期'     },
];

function validate() {
  let isValid = true;

  fields.forEach(({ id, label }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`err-${id}`);
    const value = input.value.trim();

    if (!value) {
      input.classList.add('is-error');
      errEl.textContent = `${label}を入力してください。`;
      isValid = false;
    } else if (input.classList.contains('is-error')) {
      isValid = false;
    } else {
      input.classList.remove('is-error');
      errEl.textContent = '';
    }
  });

  // 発注日 ≤ 納期 チェック
  const orderParsed = parseDate(document.getElementById('orderDate').value);
  const dueParsed   = parseDate(document.getElementById('dueDate').value);
  if (orderParsed && dueParsed) {
    const toDate = str => { const [y,m,d] = str.split('/').map(Number); return new Date(y, m-1, d); };
    if (toDate(orderParsed) > toDate(dueParsed)) {
      document.getElementById('dueDate').classList.add('is-error');
      document.getElementById('err-dueDate').textContent = '納期は発注日以降の日付を入力してください。';
      isValid = false;
    }
  }

  return isValid;
}

function handleRegister() {
  if (!validate()) return;
  // ※ Flask実装時はPOST送信に差し替え
  alert('登録が完了しました。');
  window.location.href = 'drawing_list.html';
}

// 入力時にエラーをリアルタイムでクリア
fields.forEach(({ id }) => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id).classList.remove('is-error');
    document.getElementById(`err-${id}`).textContent = '';
  });
});
