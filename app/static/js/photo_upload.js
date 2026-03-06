// 行選択
function selectRow(row) {
  document.querySelectorAll('.selectable-row').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
}

// ドラッグ＆ドロップ
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

// ファイル処理
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

function handleSubmit() {
  const selected = document.querySelector('.selectable-row.selected');
  if (!selected) {
    alert('図面を選択してください。');
    return;
  }
  const drawingNo = selected.querySelector('.td-drawing').textContent;
  const hasFile = document.getElementById('fileInput').files.length > 0;
  if (!hasFile) {
    alert('写真を選択してください。');
    return;
  }
  alert(`図面番号「${drawingNo}」に写真を登録しました。`);
}
