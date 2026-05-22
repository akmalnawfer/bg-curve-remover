import { removeBackground as mlRemoveBackground } from '@imgly/background-removal';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function alphaCleanupBlob(blob, alphaCleanup = {}) {
  if (typeof document === 'undefined') return Promise.resolve(blob);

  const minRegionSize = Number(alphaCleanup.minRegionSize ?? 28);
  const alphaThreshold = Number(alphaCleanup.alphaThreshold ?? 18);
  const holeFillSize = Number(alphaCleanup.holeFillSize ?? 220);
  const featherRadius = Number(alphaCleanup.featherRadius ?? 1);

  return createImageBitmap(blob).then((bmp) => {
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return blob;

    ctx.drawImage(bmp, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    const total = width * height;

    const fg = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) {
      fg[i] = data[i * 4 + 3] >= alphaThreshold ? 1 : 0;
    }

    const visited = new Uint8Array(total);
    const queue = new Uint32Array(total);

    const removeSmallForeground = () => {
      for (let i = 0; i < total; i += 1) {
        if (!fg[i] || visited[i]) continue;
        let head = 0;
        let tail = 0;
        queue[tail++] = i;
        visited[i] = 1;
        while (head < tail) {
          const idx = queue[head++];
          const x = idx % width;
          const y = (idx / width) | 0;
          const n = [
            x > 0 ? idx - 1 : -1,
            x + 1 < width ? idx + 1 : -1,
            y > 0 ? idx - width : -1,
            y + 1 < height ? idx + width : -1
          ];
          for (const ni of n) {
            if (ni < 0 || visited[ni] || !fg[ni]) continue;
            visited[ni] = 1;
            queue[tail++] = ni;
          }
        }
        if (tail < minRegionSize) {
          for (let k = 0; k < tail; k += 1) fg[queue[k]] = 0;
        }
      }
    };

    const fillSmallHoles = () => {
      visited.fill(0);
      for (let i = 0; i < total; i += 1) {
        if (fg[i] || visited[i]) continue;
        let head = 0;
        let tail = 0;
        let touchesBorder = false;
        queue[tail++] = i;
        visited[i] = 1;
        while (head < tail) {
          const idx = queue[head++];
          const x = idx % width;
          const y = (idx / width) | 0;
          if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
          const n = [
            x > 0 ? idx - 1 : -1,
            x + 1 < width ? idx + 1 : -1,
            y > 0 ? idx - width : -1,
            y + 1 < height ? idx + width : -1
          ];
          for (const ni of n) {
            if (ni < 0 || visited[ni] || fg[ni]) continue;
            visited[ni] = 1;
            queue[tail++] = ni;
          }
        }
        if (!touchesBorder && tail <= holeFillSize) {
          for (let k = 0; k < tail; k += 1) fg[queue[k]] = 1;
        }
      }
    };

    const featherMask = () => {
      const alpha = new Uint8ClampedArray(total);
      for (let i = 0; i < total; i += 1) alpha[i] = fg[i] ? 255 : 0;

      for (let pass = 0; pass < featherRadius; pass += 1) {
        const out = new Uint8ClampedArray(total);
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            let sum = 0;
            let count = 0;
            for (let oy = -1; oy <= 1; oy += 1) {
              for (let ox = -1; ox <= 1; ox += 1) {
                const nx = clamp(x + ox, 0, width - 1);
                const ny = clamp(y + oy, 0, height - 1);
                sum += alpha[ny * width + nx];
                count += 1;
              }
            }
            out[y * width + x] = Math.round(sum / count);
          }
        }
        alpha.set(out);
      }

      for (let i = 0; i < total; i += 1) data[i * 4 + 3] = alpha[i];
    };

    removeSmallForeground();
    fillSmallHoles();
    featherMask();

    ctx.putImageData(imageData, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((out) => resolve(out || blob), 'image/png', 1);
    });
  });
}

const DEFAULT_OPTIONS = {
  model: 'isnet',
  output: {
    quality: 0.98,
    type: 'image/png'
  },
  alphaCleanup: {
    alphaThreshold: 18,
    minRegionSize: 28,
    holeFillSize: 220,
    featherRadius: 1
  }
};

export async function removeBackground(input, options = {}) {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
    output: {
      ...DEFAULT_OPTIONS.output,
      ...(options.output || {})
    },
    alphaCleanup: {
      ...DEFAULT_OPTIONS.alphaCleanup,
      ...(options.alphaCleanup || {}),
      ...(options.extraction || {})
    }
  };

  const { alphaCleanup, ...mlOptions } = merged;
  const mlResult = await mlRemoveBackground(input, mlOptions);
  return alphaCleanupBlob(mlResult, alphaCleanup);
}

export async function removeBackgroundToObjectURL(input, options = {}) {
  const blob = await removeBackground(input, options);
  if (!(blob instanceof Blob)) {
    throw new Error('Expected removeBackground to return a Blob in browser usage.');
  }
  return URL.createObjectURL(blob);
}
