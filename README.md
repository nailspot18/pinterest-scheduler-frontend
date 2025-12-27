Pinterest UI (Vite + React + Tailwind + MUI)

Setup:
1. Unzip this folder and cd into it.
2. Install dependencies:
   npm install
3. Initialize Tailwind (if you haven't already):
   npx tailwindcss init -p
4. (Optional) Remove stray TypeScript files:
   npm run clean-ts
5. Start dev server:
   npm run dev

The UI expects the backend at the URL set in .env (VITE_BACKEND_URL). By default this package includes:
VITE_BACKEND_URL=http://localhost:5000
