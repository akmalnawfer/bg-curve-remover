import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

const DEFAULT_OPTIONS = {
  model: 'isnet',
  output: {
    quality: 0.95,
    type: 'image/png'
  },
  alphaCleanup: {
    alphaThreshold: 18,
    minRegionSize: 28
  }
};

async function cleanupAlphaInBrowser(blob, alphaCleanup) {
  if (typeof document === 'undefined' || !(blob instanceof Blob) || !alphaCleanup) return blob;

  const alphaThreshold = Number(alphaCleanup.alphaThreshold ?? 18);
  const minRegionSize = Number(alphaCleanup.minRegionSize ?? 28);

  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return blob;

  ctx.drawImage(bmp, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const total = width * height;
  const mask = new Uint8Array(total);

  for (let i = 0; i < total; i += 1) {
    const a = data[i * 4 + 3];
    mask[i] = a >= alphaThreshold ? 1 : 0;
  }

  const visited = new Uint8Array(total);
  const queue = new Uint32Array(total);

  for (let i = 0; i < total; i += 1) {
    if (!mask[i] || visited[i]) continue;

    let head = 0;
    let tail = 0;
    let count = 0;
    queue[tail++] = i;
    visited[i] = 1;

    while (head < tail) {
      const idx = queue[head++];
      count += 1;
      const x = idx % width;
      const y = (idx / width) | 0;

      const n1 = x > 0 ? idx - 1 : -1;
      const n2 = x + 1 < width ? idx + 1 : -1;
      const n3 = y > 0 ? idx - width : -1;
      const n4 = y + 1 < height ? idx + width : -1;

      if (n1 >= 0 && mask[n1] && !visited[n1]) { visited[n1] = 1; queue[tail++] = n1; }
      if (n2 >= 0 && mask[n2] && !visited[n2]) { visited[n2] = 1; queue[tail++] = n2; }
      if (n3 >= 0 && mask[n3] && !visited[n3]) { visited[n3] = 1; queue[tail++] = n3; }
      if (n4 >= 0 && mask[n4] && !visited[n4]) { visited[n4] = 1; queue[tail++] = n4; }
    }

    if (count < minRegionSize) {
      for (let q = 0; q < tail; q += 1) {
        const p = queue[q] * 4 + 3;
        data[p] = 0;
      }
    } else {
      for (let q = 0; q < tail; q += 1) {
        const p = queue[q] * 4 + 3;
        if (data[p] < alphaThreshold) data[p] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((out) => resolve(out || blob), 'image/png', 1);
  });
}

export async function removeBackground(input, options = {}) {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    output: {
      ...DEFAULT_OPTIONS.output,
      ...(options.output || {})
    },
    alphaCleanup: {
      ...DEFAULT_OPTIONS.alphaCleanup,
      ...(options.alphaCleanup || {})
    }
  };

  const { alphaCleanup, ...imglyOptions } = mergedOptions;
  const rawResult = await imglyRemoveBackground(input, imglyOptions);
  return cleanupAlphaInBrowser(rawResult, alphaCleanup);
}

export async function removeBackgroundToObjectURL(input, options = {}) {
  const blob = await removeBackground(input, options);
  if (!(blob instanceof Blob)) {
    throw new Error('Expected removeBackground to return a Blob in browser usage.');
  }
  return URL.createObjectURL(blob);
}
