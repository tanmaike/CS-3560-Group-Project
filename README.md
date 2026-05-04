# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Running from WSL and opening in Windows

1. Install dependencies in WSL:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open this URL in your Windows browser:
   `http://localhost:5173`

If `localhost` does not work, use the WSL IP:

```bash
hostname -I
```

Then open `http://<wsl-ip>:5173` in Windows.

## Small backend (progress slice)

Run API:

```bash
npm run dev:api
```

Base URL: `http://localhost:8787`

Quick checks:

```bash
curl http://localhost:8787/api/health
curl http://localhost:8787/api/jobs
```

Minimal flow sample:

```bash
curl -X POST http://localhost:8787/api/jobs/201/diagnosis \
  -H "Content-Type: application/json" \
  -d '{"diag_code":"engine_noise","diag_note":"heard on idle"}'

curl -X POST http://localhost:8787/api/jobs/201/quote \
  -H "Content-Type: application/json" \
  -d '{"amount_num":188.5}'

curl http://localhost:8787/api/manager/cost-pings
```
