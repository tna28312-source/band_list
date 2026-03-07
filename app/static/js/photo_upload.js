// ─── 全選択チェックボックス ───────────────────────
function toggleAll(masterCheckbox) {
  document.querySelectorAll('.item-check').forEach(cb => {
    cb.checked = masterCheckbox.checked;
  });
}

// チェックが変わったとき、全選択チェックボックスの状態を同期
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('item-check')) {
    const allChecks = document.querySelectorAll('.item-check');
    const checkedCount = document.querySelectorAll('.item-check:checked').length;
    const masterCb = document.getElementById('checkAll');
    if (masterCb) {
      masterCb.checked = checkedCount === allChecks.length;
      masterCb.indeterminate = checkedCount > 0 && checkedCount < allChecks.length;
    }
  }
});

// ─── 取り消し ────────────────────────────────────
function cancelSelected() {
  const checked = document.querySelectorAll('.item-check:checked');

  if (checked.length === 0) {
    alert('取り消す図面にチェックを入れてください。');
    return;
  }

  // チェックされた行を削除 & サーバーのセッションからも削除
  const removeIds = [];
  checked.forEach(cb => {
    const id = cb.dataset.id;
    removeIds.push(id);
    const row = document.querySelector(`.cart-row[data-id="${id}"]`);
    if (row) row.remove();
  });

  // セッションから削除をサーバーに送信
  fetch('/delivery/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: removeIds.map(Number) })
  });

  // 全選択チェックボックスをリセット
  const masterCb = document.getElementById('checkAll');
  if (masterCb) {
    masterCb.checked = false;
    masterCb.indeterminate = false;
  }

  // テーブルが空になったら空メッセージを表示 & 登録ボタンを無効化
  const remaining = document.querySelectorAll('.cart-row');
  if (remaining.length === 0) {
    const tbody = document.getElementById('cartTableBody');
    tbody.innerHTML = `
      <tr id="emptyRow">
        <td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">
          カートが空です。図面一覧から「納品登録」ボタンを押してください。
        </td>
      </tr>`;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;

    // ヘッダーのチェックボックスも非表示
    const checkAllEl = document.getElementById('checkAll');
    if (checkAllEl) checkAllEl.style.visibility = 'hidden';
  }
}

// ─── ドラッグ＆ドロップ ──────────────────────────
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

// ─── ファイル処理 ────────────────────────────────
function handleFiles(files) {
  if (!files.length) return;
  const previewArea = document.getElementById('previewArea');
  const previewList = document.getElementById('previewList');
  previewList.innerHTML = '';

  Array.from(files).forEach(file => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        item.innerHTML = `
          <img src="${e.target.result}" class="preview-thumb" alt="${file.name}">
          <div class="preview-filename">${file.name}</div>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      item.innerHTML = `<div class="preview-filename">📄 ${file.name}</div>`;
    }
    previewList.appendChild(item);
  });

  uploadArea.style.display = 'none';
  previewArea.style.display = 'block';
}

function clearFiles() {
  document.getElementById('fileInput').value = '';
  document.getElementById('previewArea').style.display = 'none';
  document.getElementById('uploadArea').style.display = 'flex';
}
