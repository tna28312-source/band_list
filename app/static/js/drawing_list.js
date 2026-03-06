// 納入日リンクをクリックで写真モーダルを開く
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