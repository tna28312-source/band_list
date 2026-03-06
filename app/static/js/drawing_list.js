// 納入日リンクをクリックで写真モーダルを開く
function openPhotoModal(link, event) {
  event.preventDefault();

  // クリックした行から図面情報を取得
  const row = link.closest('tr');
  const drawingNo  = row.querySelector('.td-drawing').textContent.trim();
  const projectNo  = row.querySelector('.td-project').textContent.trim();
  const deliveryDate = link.textContent.trim();

  document.getElementById('modalTitle').textContent = `図面番号：${drawingNo}`;
  document.getElementById('modalMeta').textContent  = `工事番号：${projectNo}　／　納入日：${deliveryDate}`;

  // ※ Flask実装時はサーバーから写真URLを取得して差し替える
  // 現在はテスト用画像を表示
  document.getElementById('modalBody').innerHTML = `
    <img src="../static/uploads/test.jpg" style="max-width:100%; border-radius:8px;">
  `;

  document.getElementById('photoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
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
