# reg-editor-policy

A simple browser app to create and export Windows Registry (`.reg`) files.

## Use locally

1. Open `/home/runner/work/reg-editor-policy/reg-editor-policy/index.html` in a browser.
2. Enter a filename and registry content.
3. Click **Export .reg file** to download your `.reg` file.

The app ensures:
- `.reg` extension is present
- `Windows Registry Editor Version 5.00` header is included

## GitHub Pages deployment

This repository includes a GitHub Actions workflow at:

`/home/runner/work/reg-editor-policy/reg-editor-policy/.github/workflows/deploy-pages.yml`

It deploys the site to GitHub Pages on pushes to `main`.

After the workflow runs, enable Pages in repository settings if needed:
- **Settings → Pages → Source: GitHub Actions**
