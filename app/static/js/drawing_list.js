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