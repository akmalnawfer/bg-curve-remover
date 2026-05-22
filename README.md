# bg-curve-remover

A pure JavaScript background remover for browser and Node.js workflows.

`bg-curve-remover` removes image backgrounds using AI segmentation and then applies alpha cleanup to reduce leftover noise around curves and small interior/exterior background fragments.

## Install

```bash
npm install bg-curve-remover
```

## Quick Start (Browser)

```js
import { removeBackgroundToObjectURL } from 'bg-curve-remover';

const input = document.querySelector('#file').files[0];
const resultUrl = await removeBackgroundToObjectURL(input);
document.querySelector('#preview').src = resultUrl;
```

## Core API

### `removeBackground(input, options?)`

Removes the background and returns a processed image object.

- Browser usage: returns a `Blob` (PNG by default)
- Input types supported by the underlying model include `File`, `Blob`, URL input, and binary buffers

```js
import { removeBackground } from 'bg-curve-remover';

const outputBlob = await removeBackground(file, {
  output: { type: 'image/png', quality: 0.98 },
  alphaCleanup: { alphaThreshold: 18, minRegionSize: 28 }
});
```

### `removeBackgroundToObjectURL(input, options?)`

Convenience wrapper for browser previews.

- Calls `removeBackground(...)`
- Converts result `Blob` to `URL.createObjectURL(...)`

```js
import { removeBackgroundToObjectURL } from 'bg-curve-remover';

const url = await removeBackgroundToObjectURL(file);
img.src = url;
```

## Options

### `output`

Output image configuration.

- `type`: MIME type (recommended: `image/png` for transparency)
- `quality`: compression quality (used where relevant)

```js
{ output: { type: 'image/png', quality: 0.98 } }
```

### `alphaCleanup`

Post-processing cleanup for better cut edges and reduced artifacts.

- `alphaThreshold` (default `18`): pixels with low alpha below this threshold are removed
- `minRegionSize` (default `28`): tiny connected alpha regions below this size are removed

```js
{ alphaCleanup: { alphaThreshold: 20, minRegionSize: 36 } }
```

This helps remove leftover stray pixels both outside and inside the subject region after segmentation.

## Demo

Live demo (GitHub Pages):

- [https://akmalnawfer.github.io/bg-curve-remover/](https://akmalnawfer.github.io/bg-curve-remover/)

Run demo locally:

```bash
npm install
npm run demo
```

## Use in Your Project

Typical flow:

1. User selects or drops image
2. Call `removeBackground(...)`
3. Show preview, upload output, or download PNG

Example (download):

```js
const resultBlob = await removeBackground(file, {
  output: { type: 'image/png', quality: 0.98 }
});

const url = URL.createObjectURL(resultBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'cutout.png';
a.click();
URL.revokeObjectURL(url);
```

## Manual npm Release

```bash
npm login
npm version patch
npm publish --access public
```

Then push release commit/tag:

```bash
git push && git push --tags
```

If npm asks for OTP:

```bash
npm publish --access public --otp=<6-digit-code>
```

## Notes

- First run may be slower while model assets are loaded.
- PNG output is recommended for transparent backgrounds.
- Complex hair/fur/translucent edges can still benefit from manual touch-up depending on source image quality.

## License

MIT
