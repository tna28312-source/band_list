// ─── テーブルフィルター ───────────────────────────
//
// 使い方：
//   drawing_list.js の末尾にこのファイルの内容を追記する。
//   または <script src="filter.js"></script> として別ファイルのまま読み込んでも可。
//

(function () {
  // ── 設定：フィルターをかける列の定義 ──────────────
  //   colIndex : tbody の td インデックス（0始まり）
  //   type     : 'text' | 'date'
  const FILTER_COLS = [
    { key: 'project_no',  label: '工事番号', colIndex: 1, type: 'text' },
    { key: 'drawing_no',  label: '図面番号', colIndex: 2, type: 'text' },
    { key: 'vendor',      label: '発注先',   colIndex: 3, type: 'text' },
    { key: 'order_date',  label: '発注日',   colIndex: 4, type: 'date' },
    { key: 'due_date',    label: '納期',     colIndex: 5, type: 'date' },
    { key: 'delivered_at',label: '納入日',   colIndex: 6, type: 'date' },
  ];

  // ── 状態管理 ──────────────────────────────────────
  // activeFilters: { [key]: Set<string> | null }
  //   null  → フィルターなし（全表示）
  //   Set   → その値のみ表示
  const activeFilters = {};
  FILTER_COLS.forEach(c => { activeFilters[c.key] = null; });

  // ソート状態
  let sortState = { key: null, dir: null }; // dir: 'asc' | 'desc'

  // 現在開いているドロップダウンのキー
  let openKey = null;

  // ── DOM生成 ───────────────────────────────────────
  const dropdown = document.createElement('div');
  dropdown.id = 'filterDropdown';
  document.body.appendChild(dropdown);

  // ── ヘッダーにクラスと▼を付与 ──────────────────
  function initHeaders() {
    const thead = document.querySelector('table thead tr');
    if (!thead) return;
    const ths = thead.querySelectorAll('th');

    FILTER_COLS.forEach(col => {
      const th = ths[col.colIndex];
      if (!th) return;
      th.classList.add('filterable');
      th.dataset.filterKey = col.key;

      // ラベル＋矢印をラップ
      const inner = document.createElement('span');
      inner.className = 'th-inner';
      inner.innerHTML = `<span>${th.textContent.trim()}</span><span class="th-arrow">▼</span>`;
      th.textContent = '';
      th.appendChild(inner);

      th.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(col.key, th);
      });
    });
  }

  // ── ドロップダウンの開閉 ────────────────────────
  function toggleDropdown(key, thEl) {
    if (openKey === key) {
      closeDropdown();
      return;
    }
    openDropdown(key, thEl);
  }

  function openDropdown(key, thEl) {
    openKey = key;
    renderDropdown(key);

    dropdown.classList.add('open');

    // 位置決め：thの直下に表示
    const rect = thEl.getBoundingClientRect();
    const ddW  = 220;
    let left   = rect.left + window.scrollX;
    const maxLeft = window.innerWidth - ddW - 8;
    if (left > maxLeft) left = maxLeft;

    dropdown.style.left      = left + 'px';
    dropdown.style.minWidth  = ddW + 'px';

    // 縦位置：高さを取得して画面中央に配置
    dropdown.style.visibility = 'hidden';
    dropdown.style.top        = '-9999px';
    const ddH = dropdown.offsetHeight;
    dropdown.style.visibility = '';

    const centerTop = window.scrollY + (window.innerHeight - ddH) / 2;
    dropdown.style.top = Math.max(window.scrollY + 8, centerTop) + 'px';
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
    openKey = null;
  }

  // 外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // ── ドロップダウンの中身を描画 ───────────────────
  function renderDropdown(key) {
    const col = FILTER_COLS.find(c => c.key === key);
    if (!col) return;

    // その列の全ユニーク値を取得（空行除外）
    const rows = Array.from(document.querySelectorAll('tbody tr.drawing-row'));
    const allValues = [...new Set(
      rows.map(tr => {
        const td = tr.querySelectorAll('td')[col.colIndex];
        // 納入日列はリンクのテキストを取る
        return td ? td.textContent.trim() : '';
      }).filter(v => v !== '')
    )].sort();

    // 現在の選択状態
    const currentFilter = activeFilters[key]; // null or Set

    // HTML組み立て
    let html = `
      <div class="filter-sort-section">
        <button class="filter-sort-btn" data-sort="asc">
          <span class="sort-icon">↑</span> 昇順で並べ替え
        </button>
        <button class="filter-sort-btn" data-sort="desc">
          <span class="sort-icon">↓</span> 降順で並べ替え
        </button>
      </div>
      <div class="filter-list-section">
        <div class="filter-list-header">絞り込み</div>
        <label class="filter-item filter-item-all">
          <input type="checkbox" id="filterCheckAll" ${currentFilter === null ? 'checked' : ''}>
          <span class="filter-item-label">（すべて選択）</span>
        </label>
        <div class="filter-list-scroll">
    `;

    allValues.forEach(val => {
      const checked = currentFilter === null || currentFilter.has(val);
      html += `
        <label class="filter-item">
          <input type="checkbox" class="filter-value-check" value="${escHtml(val)}" ${checked ? 'checked' : ''}>
          <span class="filter-item-label">${escHtml(val)}</span>
        </label>
      `;
    });

    html += `
        </div>
      </div>
      <div class="filter-footer">
        <button class="filter-btn-clear">クリア</button>
        <button class="filter-btn-ok">OK</button>
      </div>
    `;

    dropdown.innerHTML = html;

    // ── イベント ────────────────────────────────
    // ソートボタン
    dropdown.querySelectorAll('.filter-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applySort(key, col.colIndex, btn.dataset.sort);
        closeDropdown();
      });
    });

    // 「すべて選択」チェック
    const checkAll = dropdown.querySelector('#filterCheckAll');
    checkAll.addEventListener('change', () => {
      dropdown.querySelectorAll('.filter-value-check').forEach(cb => {
        cb.checked = checkAll.checked;
      });
    });

    // 個別チェック → すべて選択の状態を同期
    dropdown.querySelectorAll('.filter-value-check').forEach(cb => {
      cb.addEventListener('change', () => {
        syncAllCheck();
      });
    });

    // クリアボタン
    dropdown.querySelector('.filter-btn-clear').addEventListener('click', () => {
      activeFilters[key] = null;
      applyAllFilters();
      updateHeaderState();
      closeDropdown();
    });

    // OKボタン
    dropdown.querySelector('.filter-btn-ok').addEventListener('click', () => {
      const checked = dropdown.querySelectorAll('.filter-value-check:checked');
      const allCbs  = dropdown.querySelectorAll('.filter-value-check');
      if (checked.length === allCbs.length) {
        activeFilters[key] = null; // 全選択 = フィルターなし
      } else {
        activeFilters[key] = new Set(Array.from(checked).map(cb => cb.value));
      }
      applyAllFilters();
      updateHeaderState();
      closeDropdown();
    });
  }

  function syncAllCheck() {
    const all  = dropdown.querySelectorAll('.filter-value-check');
    const chk  = dropdown.querySelectorAll('.filter-value-check:checked');
    const allCb = dropdown.querySelector('#filterCheckAll');
    if (!allCb) return;
    allCb.checked = chk.length === all.length;
    allCb.indeterminate = chk.length > 0 && chk.length < all.length;
  }

  // ── フィルター適用 ──────────────────────────────
  function applyAllFilters() {
    const rows = document.querySelectorAll('tbody tr.drawing-row');
    rows.forEach(tr => {
      let show = true;
      FILTER_COLS.forEach(col => {
        if (!show) return;
        const f = activeFilters[col.key];
        if (f === null) return; // このキーはフィルターなし
        const td  = tr.querySelectorAll('td')[col.colIndex];
        const val = td ? td.textContent.trim() : '';
        if (!f.has(val)) show = false;
      });
      tr.style.display = show ? '' : 'none';
    });
  }

  // ── ソート適用 ──────────────────────────────────
  function applySort(key, colIndex, dir) {
    sortState = { key, dir };

    const tbody = document.querySelector('table tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr.drawing-row'));

    rows.sort((a, b) => {
      const aVal = a.querySelectorAll('td')[colIndex]?.textContent.trim() ?? '';
      const bVal = b.querySelectorAll('td')[colIndex]?.textContent.trim() ?? '';

      // 空値は末尾へ
      if (aVal === '' && bVal === '') return 0;
      if (aVal === '') return 1;
      if (bVal === '') return -1;

      // 日付列（YYYY/MM/DD）は数値比較
      const col = FILTER_COLS.find(c => c.key === key);
      let cmp = 0;
      if (col && col.type === 'date') {
        const aD = aVal.replace(/\//g, '');
        const bD = bVal.replace(/\//g, '');
        cmp = aD.localeCompare(bD);
      } else {
        cmp = aVal.localeCompare(bVal, 'ja');
      }
      return dir === 'asc' ? cmp : -cmp;
    });

    // 並び替え後のrowをtbodyに再挿入（空行は末尾に残す）
    const emptyRows = Array.from(tbody.querySelectorAll('tr.empty-row'));
    const noDataRow = tbody.querySelector('tr:not(.drawing-row):not(.empty-row)');

    rows.forEach(r => tbody.appendChild(r));
    if (noDataRow) tbody.appendChild(noDataRow);
    emptyRows.forEach(r => tbody.appendChild(r));
  }

  // ── ヘッダーのアクティブ状態を更新 ───────────────
  function updateHeaderState() {
    document.querySelectorAll('th.filterable').forEach(th => {
      const key = th.dataset.filterKey;
      if (activeFilters[key] !== null) {
        th.classList.add('filter-active');
      } else {
        th.classList.remove('filter-active');
      }
    });
  }

  // ── ユーティリティ ───────────────────────────────
  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── 初期化 ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', initHeaders);
  // DOMContentLoaded 済みの場合（script が末尾の場合）にも対応
  if (document.readyState !== 'loading') initHeaders();

})();
