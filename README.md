# HackCbs-Project

A Project for hackCBS 8.0 hackathon

## React + SCSS skeleton

This repository includes a minimal React + SCSS (Sass) skeleton using Vite as the dev server/build tool. Files were added under `src/` including a global SCSS color palette at `src/styles/_colors.scss` with the palette:

- `#CDF5FD`
- `#89CFF3`
- `#00A9FF`

### Run locally

1. Install dependencies:

```bash
# macOS / zsh
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app at the URL printed by Vite (usually http://localhost:5173).

Notes:
- The main entry is `src/main.jsx` and the root component is `src/App.jsx`.
- SCSS variables and CSS variables live in `src/styles/_colors.scss` and are imported by `src/styles/global.scss`.

Next steps you might want:
- Run `npm run build` to create a production bundle.
- Add ESLint/Prettier or TypeScript if you prefer stricter checks.
