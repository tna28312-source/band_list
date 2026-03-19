// ─── チェックボックス ────────────────────────────
function toggleAll(masterCb) {
  document.querySelectorAll('.item-check').forEach(cb => {
    cb.checked = masterCb.checked;
  });
  updateDeleteBtn();
}

function onCheckChange() {
  const allChecks = document.querySelectorAll('.item-check');
  const checkedCount = document.querySelectorAll('.item-check:checked').length;
  const masterCb = document.getElementById('checkAll');
  if (masterCb) {
    masterCb.checked = checkedCount === allChecks.length && allChecks.length > 0;
    masterCb.indeterminate = checkedCount > 0 && checkedCount < allChecks.length;
  }
  updateDeleteBtn();
}

function updateDeleteBtn() {
  const checkedCount = document.querySelectorAll('.item-check:checked').length;
  const btn = document.getElementById('btnDelete');
  if (btn) btn.disabled = checkedCount === 0;
}

// ─── 論理削除 ────────────────────────────────────
async function deleteSelected() {
  const checked = document.querySelectorAll('.item-check:checked');
  if (checked.length === 0) return;

  if (!confirm(`チェックした${checked.length}件を削除しますか？`)) return;

  const ids = Array.from(checked).map(cb => Number(cb.dataset.id));

  const res = await fetch('/drawing/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });

  if ((await res.json()).ok) {
    ids.forEach(id => {
      const row = document.querySelector(`.drawing-row[data-id="${id}"]`);
      if (row) row.remove();
    });
    // 全選択チェックをリセット
    const masterCb = document.getElementById('checkAll');
    if (masterCb) { masterCb.checked = false; masterCb.indeterminate = false; }
    updateDeleteBtn();
  }
}

// ─── 写真モーダル ─────────────────────────────────

async function openPhotoModal(drawingId, event) {
  event.preventDefault();

  // クリックした行から図面情報を取得
  const row = event.target.closest('tr');
  const drawingNo    = row.querySelector('.td-drawing').textContent.trim();
  const projectNo    = row.querySelector('.td-project').textContent.trim();
  const deliveryDate = event.target.textContent.trim();

  document.getElementById('modalTitle').textContent = `図面番号：${drawingNo}`;
  document.getElementById('modalMeta').textContent  = `工事番号：${projectNo}　／　納入日：${deliveryDate}`;

  // ローディング表示
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align:center; padding:40px; color:#888;">読み込み中...</div>
  `;

  document.getElementById('photoModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // FlaskのAPIから写真URLを取得
  try {
    const res  = await fetch(`/photo/${drawingId}`);
    const data = await res.json();
    document.getElementById('modalBody').innerHTML = `
      <img src="${data.photo_url}" style="max-width:100%; border-radius:8px;">
    `;
  } catch (e) {
    document.getElementById('modalBody').innerHTML = `
      <div style="text-align:center; padding:40px; color:#e55;">写真の読み込みに失敗しました</div>
    `;
  }
}

// オーバーレイ外クリックで閉じる
function closeModal(event) {
  if (event.target === document.getElementById('photoModal')) {
    closePhotoModal();
  }
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ESCキーでも閉じる
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePhotoModal();
});
// ─── スクロール時にテーブルヘッダーを固定 ────────────
(function () {
  // ページ読み込み後に実行
  window.addEventListener('load', initStickyHeader);
  // リサイズ時も再計算
  window.addEventListener('resize', resetStickyHeader);

  let clonedThead = null;   // 固定用のクローン要素
  let tableEl     = null;   // 元のtable要素
  let cardEl      = null;   // .card要素

  function initStickyHeader() {
    tableEl = document.querySelector('.card table');
    cardEl  = document.querySelector('.card');
    if (!tableEl || !cardEl) return;

    // 縦スクロール（ページ全体）を監視
    window.addEventListener('scroll', onScroll, { passive: true });
    // 横スクロール（.card 内）を監視して固定ヘッダーの位置を同期
    cardEl.addEventListener('scroll', syncColumnWidths, { passive: true });
    onScroll(); // 初回チェック
  }

  function onScroll() {
    if (!tableEl || !cardEl) return;

    const cardRect  = cardEl.getBoundingClientRect();
    const theadEl   = tableEl.querySelector('thead');
    const theadH    = theadEl ? theadEl.offsetHeight : 0;
    const cardBottom = cardRect.bottom;

    // カードの上端が画面上端より上にいったら固定ヘッダーを表示
    // カードの下端がヘッダーの高さより小さくなったら非表示（テーブル末端）
    const shouldFix = cardRect.top < 0 && cardBottom > theadH;

    if (shouldFix) {
      showFixedHeader();
    } else {
      hideFixedHeader();
    }
  }

  function showFixedHeader() {
    if (clonedThead) {
      // すでに表示中 → 幅だけ同期
      syncColumnWidths();
      return;
    }

    const theadEl = tableEl.querySelector('thead');
    if (!theadEl) return;

    // クローンテーブルを作る（元のtableと同じ構造）
    const fixedTable = document.createElement('table');
    fixedTable.className = tableEl.className;
    // 元テーブルのcolumn幅をコピーするためのcolgroupを作成
    fixedTable.style.cssText = [
      'position:fixed',
      'top:0',
      'left:' + cardEl.getBoundingClientRect().left + 'px',
      'width:' + cardEl.getBoundingClientRect().width + 'px',
      'z-index:50',
      'margin:0',
      'border-collapse:collapse',
      'background:transparent',
      'pointer-events:none',
    ].join(';');

    clonedThead = theadEl.cloneNode(true);
    // クローン内のチェックボックスは操作不可にする（pointer-events:none なので影響ないが念のため）
    fixedTable.appendChild(clonedThead);
    document.body.appendChild(fixedTable);

    // 列幅を元テーブルに合わせる
    syncColumnWidths();

    // 固定ヘッダーのラッパーを保持
    clonedThead._fixedTable = fixedTable;
  }

  function hideFixedHeader() {
    if (!clonedThead) return;
    if (clonedThead._fixedTable) {
      clonedThead._fixedTable.remove();
    }
    clonedThead = null;
  }

  function syncColumnWidths() {
    if (!clonedThead) return;

    const fixedTable = clonedThead._fixedTable;
    if (!fixedTable) return;

    // .card の位置・幅を再取得
    const cardRect = cardEl.getBoundingClientRect();
    // 横スクロール量を引いて固定ヘッダーをテーブルに追従させる
    fixedTable.style.left      = cardRect.left + 'px';
    fixedTable.style.width     = cardRect.width + 'px';
    fixedTable.style.overflowX = 'hidden';
    // テーブル本体の横スクロール位置に合わせてクローンをずらす
    const scrollLeft = cardEl.scrollLeft;
    fixedTable.querySelector('thead').style.transform = 'translateX(-' + scrollLeft + 'px)';

    // 元の th と固定 th の幅を合わせる
    const origThs  = tableEl.querySelectorAll('thead th');
    const cloneThs = clonedThead.querySelectorAll('th');
    origThs.forEach(function (th, i) {
      if (cloneThs[i]) {
        var thW = th.getBoundingClientRect().width;
        cloneThs[i].style.width    = thW + 'px';
        cloneThs[i].style.minWidth = thW + 'px';
      }
    });
  }

  function resetStickyHeader() {
    hideFixedHeader();
    onScroll();
  }
})();
