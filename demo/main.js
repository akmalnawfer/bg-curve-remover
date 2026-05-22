import { removeBackgroundToObjectURL } from '../src/index.js';

const fileInput = document.getElementById('file');
const statusEl = document.getElementById('status');
const originalEl = document.getElementById('original');
const resultEl = document.getElementById('result');
const downloadEl = document.getElementById('download');
const dropZoneEl = document.getElementById('drop-zone');
const dropHintEl = document.getElementById('drop-hint');

let resultUrl = '';
let originalUrl = '';

function showSelectedImage(file) {
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  originalUrl = URL.createObjectURL(file);
  originalEl.src = originalUrl;
  dropHintEl.classList.add('hidden');
}

async function processFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    statusEl.textContent = 'Please use an image file.';
    return;
  }

  showSelectedImage(file);
  statusEl.textContent = `Processing ${file.name}... first run may take longer while the model loads.`;

  try {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = await removeBackgroundToObjectURL(file, {
      output: { type: 'image/png', quality: 0.98 }
    });

    resultEl.src = resultUrl;
    downloadEl.href = resultUrl;
    downloadEl.classList.remove('hidden');
    statusEl.textContent = 'Done. Background removed.';
  } catch (error) {
    statusEl.textContent = `Failed: ${error?.message || 'Unknown error'}`;
  }
}

function openFilePicker() {
  fileInput.click();
}

dropZoneEl.addEventListener('click', openFilePicker);
dropZoneEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openFilePicker();
  }
});

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0] || null;
  await processFile(file);
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZoneEl.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZoneEl.classList.add('drop-active');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZoneEl.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZoneEl.classList.remove('drop-active');
  });
});

dropZoneEl.addEventListener('drop', async (event) => {
  const file = event.dataTransfer?.files?.[0] || null;
  await processFile(file);
});
