# bg-curve-remover

A pure JavaScript background remover for browser workflows.

`bg-curve-remover` removes image backgrounds using an in-house, browser-side extraction pipeline:
- border color modeling
- background flood-growth segmentation
- curve/edge alpha softening
- small artifact cleanup

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
- Input types: `File`, `Blob`, URL string

```js
import { removeBackground } from 'bg-curve-remover';

const outputBlob = await removeBackground(file, {
  output: { type: 'image/png', quality: 0.98 },
  extraction: { edgeSoftness: 26, minSubjectRegion: 120 }
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

### `extraction`

Controls your in-house subject extraction pipeline.

- `borderSampleStep` (default `2`): border sampling stride for background color model
- `bgDistancePercentile` (default `0.35`): base threshold from color-distance distribution
- `bgGrowMultiplier` (default `1.25`): expansion factor when flood-filling background
- `minSubjectRegion` (default `120`): remove tiny foreground islands
- `edgeSoftness` (default `26`): feathering amount on extracted edges

```js
{
  extraction: {
    borderSampleStep: 2,
    bgDistancePercentile: 0.35,
    bgGrowMultiplier: 1.25,
    minSubjectRegion: 120,
    edgeSoftness: 26
  }
}
```

This helps remove leftover stray pixels both outside and inside the subject region while preserving smoother edges.

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

## Notes

- First run may be slower while model assets are loaded.
- PNG output is recommended for transparent backgrounds.
- Complex hair/fur/translucent edges can still benefit from manual touch-up depending on source image quality.
- This package does not call your backend services; extraction runs locally in-browser.

## License

MIT
