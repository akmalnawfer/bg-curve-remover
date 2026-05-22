import { removeBackground } from '../src/index.js';

const fileInput = document.getElementById('file');
const statusEl = document.getElementById('status');
const originalEl = document.getElementById('original');
const resultEl = document.getElementById('result');
const resultEmptyEl = document.getElementById('result-empty');
const downloadEl = document.getElementById('download');
const dropZoneEl = document.getElementById('drop-zone');
const hintEl = document.getElementById('hint');
const loaderEl = document.getElementById('loader');

let resultUrl = '';
let originalUrl = '';
let downloadUrl = '';
let isProcessing = false;

function setProcessing(state) {
  isProcessing = state;
  loaderEl.classList.toggle('active', state);
  dropZoneEl.setAttribute('aria-busy', String(state));
}

function showSelectedImage(file) {
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  originalUrl = URL.createObjectURL(file);
  originalEl.src = originalUrl;
  originalEl.classList.remove('hidden');
  hintEl.classList.add('hidden');
}

async function compressForDownload(blob, quality = 0.92) {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  ctx.drawImage(bmp, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((out) => resolve(out || blob), 'image/webp', quality);
  });
}

async function processFile(file) {
  if (isProcessing) return;
  if (!file || !file.type.startsWith('image/')) {
    statusEl.textContent = 'Please choose a valid image file.';
    return;
  }

  showSelectedImage(file);
  setProcessing(true);
  statusEl.textContent = `Processing ${file.name}...`;

  try {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    const resultBlob = await removeBackground(file, {
      output: { type: 'image/png', quality: 0.98 },
      alphaCleanup: { alphaThreshold: 20, minRegionSize: 36, holeFillSize: 260, featherRadius: 1 }
    });

    resultUrl = URL.createObjectURL(resultBlob);
    resultEl.src = resultUrl;
    resultEl.classList.remove('hidden');
    resultEmptyEl.classList.add('hidden');

    const compressedBlob = await compressForDownload(resultBlob, 0.92);
    downloadUrl = URL.createObjectURL(compressedBlob);
    downloadEl.href = downloadUrl;
    downloadEl.download = 'cutout.webp';
    downloadEl.classList.remove('hidden');

    const kb = Math.round(compressedBlob.size / 1024);
    statusEl.textContent = `Done. Background removed. Download optimized (${kb} KB).`;
  } catch (error) {
    statusEl.textContent = `Failed: ${error?.message || 'Unknown error'}`;
  } finally {
    setProcessing(false);
  }
}

function openFilePicker() {
  if (!isProcessing) fileInput.click();
}

dropZoneEl.addEventListener('click', openFilePicker);
dropZoneEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openFilePicker();
  }
});

fileInput.addEventListener('change', async (event) => {
  await processFile(event.target.files?.[0] || null);
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZoneEl.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (!isProcessing) dropZoneEl.classList.add('drop-active');
  });
});
['dragleave', 'drop'].forEach((eventName) => {
  dropZoneEl.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZoneEl.classList.remove('drop-active');
  });
});

dropZoneEl.addEventListener('drop', async (event) => {
  if (isProcessing) return;
  await processFile(event.dataTransfer?.files?.[0] || null);
});
