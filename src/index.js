import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

const DEFAULT_OPTIONS = {
  model: 'isnet',
  output: {
    quality: 0.95,
    type: 'image/png'
  }
};

/**
 * Remove background from an image using segmentation + alpha matting.
 * Works with URL, Blob, File, ArrayBuffer, Uint8Array, and Buffer.
 */
export async function removeBackground(input, options = {}) {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    output: {
      ...DEFAULT_OPTIONS.output,
      ...(options.output || {})
    }
  };

  return imglyRemoveBackground(input, mergedOptions);
}

/**
 * Convenience helper for browser demos/UIs.
 */
export async function removeBackgroundToObjectURL(input, options = {}) {
  const blob = await removeBackground(input, options);
  if (!(blob instanceof Blob)) {
    throw new Error('Expected removeBackground to return a Blob in browser usage.');
  }
  return URL.createObjectURL(blob);
}
