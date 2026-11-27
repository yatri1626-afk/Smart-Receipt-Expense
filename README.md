# Expense Insight Hub (SmartReceipt AI)

Track • Analyze • Optimize Spending with AI Receipt Scanning & Nutrition Intelligence.

## 🚀 Quick Start Guide (VS Code & Node.js)

Follow these simple steps after downloading and unzipping the project:

### 1. Requirements
- Node.js (v18 or higher recommended): [https://nodejs.org](https://nodejs.org)
- VS Code (or any code editor)

### 2. Setup `.env` File
In the project root directory, create a file named `.env` (or copy from `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** Get your free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). If you don't provide a key, the application will still run smoothly and allow manual receipt item entry!

### 3. Install Dependencies
Open your terminal (PowerShell, CMD, or VS Code integrated terminal) in the project folder and run:

```bash
npm install
```

### 4. Start Development Server
Run:

```bash
npm run dev
```

The server will start at:
👉 **`http://localhost:3000`**

Open that URL in your browser (Chrome, Edge, Firefox, etc.) to use the website!

---

## 🛠️ Available Scripts

- `npm run dev` : Starts the local Express + Vite development server on port 3000.
- `npm run build` : Builds the frontend with Vite and bundles the backend server with esbuild.
- `npm start` : Runs the production server (`node dist/server.cjs`).
- `npm run lint` : Runs TypeScript type checking.

---

## 💡 Verified Test Accounts (Pre-configured)
- **Pratha Ghevariya**: `prathaghevariya@gmail.com` / `prath@2006`
- **Mauli Patel**: `maulipatel@gmail.com` / `mp@11111`
- **Demo User**: `rahul@expenseinsight.com` / `password123`
