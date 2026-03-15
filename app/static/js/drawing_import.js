/* ─── drawing_import.js ─────────────────────────── */

const dropZone    = document.getElementById('dropZone');
const fileInput   = document.getElementById('excelFile');
const btnSubmit   = document.getElementById('btnSubmit');
const dropLabel   = document.getElementById('dropLabel');
const fileDisplay = document.getElementById('fileNameDisplay');
const fileNameTxt = document.getElementById('fileNameText');

// ファイルが選ばれた時の共通処理
function setFile(file) {
  if (!file) return;
  fileNameTxt.textContent = file.name;
  fileDisplay.style.display = 'flex';
  btnSubmit.disabled = false;
  dropLabel.innerHTML = 'ファイルが選択されました。「取り込み実行」を押してください。';
  dropZone.style.borderColor = 'var(--orange-mid)';
}

// ファイル選択ダイアログから選んだ時
function onFileSelect(input) {
  if (input.files.length > 0) setFile(input.files[0]);
}

// ドラッグして上に乗せた時
function onDragOver(e) {
  e.preventDefault();
  dropZone.style.background = 'var(--orange-pale)';
  dropZone.style.borderColor = 'var(--orange-mid)';
}

// ドラッグしたまま外に出た時
function onDragLeave(e) {
  dropZone.style.background = 'var(--orange-surface)';
  dropZone.style.borderColor = 'var(--orange-light)';
}

// ファイルをドロップした時
function onDrop(e) {
  e.preventDefault();
  onDragLeave(e);
  const file = e.dataTransfer.files[0];
  if (file) {
    // DataTransferのファイルをinputにセット
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    setFile(file);
  }
}

// 取り込み実行中はボタンをローディング表示（二重送信防止）
document.getElementById('importForm').addEventListener('submit', () => {
  btnSubmit.textContent = '取り込み中...';
  btnSubmit.disabled = true;
});
