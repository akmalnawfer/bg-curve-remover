# bg-curve-remover

Pure JavaScript background remover for browser and Node.js projects.

It removes full image backgrounds using semantic segmentation with alpha edge refinement, so it handles more than just the outer backdrop.

## Install

```bash
npm install bg-curve-remover
```

## Usage

```js
import { removeBackground } from 'bg-curve-remover';

const input = await fetch('https://example.com/photo.jpg').then((r) => r.blob());
const outputBlob = await removeBackground(input, {
  output: { type: 'image/png', quality: 0.98 }
});
```

## Browser helper

```js
import { removeBackgroundToObjectURL } from 'bg-curve-remover';

const url = await removeBackgroundToObjectURL(file);
image.src = url;
```

## Local demo

```bash
npm install
npm run demo
```

## GitHub demo (Pages)

After pushing to `main` and enabling GitHub Pages (source: GitHub Actions), your demo is published at:

`https://<your-github-username>.github.io/bg-curve-remover/`

## npm release

1. Create an npm access token and save it as repository secret `NPM_TOKEN`.
2. Create a GitHub Release (or run workflow manually).
3. `.github/workflows/publish-npm.yml` publishes the package.

## Notes

- First inference can be slower because model artifacts are loaded.
- For best output transparency, use PNG output.
