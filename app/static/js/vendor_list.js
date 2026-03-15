/* ─── vendor_list.js ─────────────────────────── */

const checkAll = document.getElementById('check-all');
const btnDelete = document.getElementById('btn-delete');

// チェック状態に応じて削除ボタンの有効/無効を切り替え
function updateDeleteBtn() {
  const checked = document.querySelectorAll('.item-check:checked');
  btnDelete.disabled = checked.length === 0;
}

// 全選択チェックボックスの変更を監視
checkAll.addEventListener('change', () => {
  document.querySelectorAll('.item-check').forEach(cb => cb.checked = checkAll.checked);
  updateDeleteBtn();
});

// 各行のチェックボックスの変更を監視
document.querySelectorAll('.item-check').forEach(cb => {
  cb.addEventListener('change', updateDeleteBtn);
});

// 削除ボタンクリック時の処理
btnDelete.addEventListener('click', () => {
  const ids = [...document.querySelectorAll('.item-check:checked')].map(cb => cb.value);
  if (!ids.length) return;
  if (!confirm(`${ids.length} 件の発注先を削除しますか？`)) return;

  fetch(btnDelete.dataset.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  })
  .then(r => r.json())
  .then(data => { if (data.ok) location.reload(); });
});
