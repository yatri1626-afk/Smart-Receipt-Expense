# 📄 Expense Insight Hub - Full Technical Documentation

**Project Name:** Expense Insight Hub (Smart Financial & Receipt Management Platform)  
**Date:** September 2026  
**Language & Tech Stack:** Full-Stack TypeScript (React 19 + Node.js/Express + Google Gemini AI)

---

## 1. Executive Summary
**Expense Insight Hub** is a full-stack web application designed to help users manage daily shopping expenses. By scanning receipts using Artificial Intelligence (Google Gemini AI), it extracts store details, items, prices, taxes, and categorizes monthly expenses, budgeting, nutrition indicators, and administrative management.

---

## 2. Core Technologies

### 🔹 Primary Language:
- **TypeScript (v5.8+)**: Used across both frontend and backend for end-to-end type safety, reliable refactoring, and high performance.

---

### 🔹 Frontend Architecture:
1. **React 19 (React.js)**: Component-based modern user interface.
2. **Tailwind CSS (v4)**: Utility-first styling with responsive layouts and dark/light mode support.
3. **Vite**: Ultra-fast asset bundler and developer tooling.
4. **Motion**: Smooth page transitions and micro-interactions.
5. **Lucide React**: Clean and modern vector icons.
6. **Recharts**: Interactive spending analysis charts, bar graphs, and pie charts.

---

### 🔹 Backend Architecture:
1. **Node.js**: Server-side runtime environment.
2. **Express.js (v4.21+)**: Server REST API routing and middleware controllers.
3. **Google GenAI SDK (`@google/genai`)**: Optical Character Recognition (OCR) and structured receipt data extraction.
4. **Database**: 
   - `data/database.json`: File-system persistent JSON database storing users, receipts, items, and budget records.

---

## 3. Detailed File Breakdown

### 📁 1. Root Files (Configuration & Server)
- **`server.ts`**: Full backend server code handling:
  - `/api/scan-receipt`: Gemini AI receipt scanning endpoint.
  - `/api/auth/*`: User registration and authentication.
  - `/api/receipts/*`: Receipt storage, retrieval, and updates.
  - `/api/budget/*`: Budget limits and spending thresholds.
- **`package.json`**: NPM packages, dependencies, and build scripts.
- **`index.html`**: Entry HTML5 template.
- **`vite.config.ts`**: Vite and Tailwind configuration.
- **`tsconfig.json`**: TypeScript compiler configuration.

---

### 📁 2. `src/` - Core Frontend Files
- **`src/main.tsx`**: Application entry point (DOM rendering).
- **`src/App.tsx`**: Main controller handling navigation, routing, dark mode, and authentication state.
- **`src/types.ts`**: TypeScript interfaces and types (User, Receipt, Item, Category, AdminStats).
- **`src/index.css`**: Tailwind CSS global styling and design tokens.
- **`src/mockData.ts`**: Initial preview demo datasets.

---

### 📁 3. `src/pages/` - Application Pages
1. **`DashboardPage.tsx`**: Main dashboard with monthly expense summaries, budget progress bar, and recent bills.
2. **`UploadReceiptPage.tsx`**: Receipt scanning and uploading page with camera and drag-and-drop file upload.
3. **`ReceiptsHistoryPage.tsx`**: Uploaded receipt history with search, sorting, and category filters.
4. **`BudgetPage.tsx`**: Monthly budget limits, overspending alerts, and category planning.
5. **`ExpenseAnalysisPage.tsx`**: Category spending graphs, trends, and charts.
6. **`HealthAnalysisPage.tsx`**: Dietary and nutrition indicators across grocery purchases.
7. **`MonthlyReportPage.tsx`**: Downloadable monthly spending audit report.
8. **`NearbyShopsPage.tsx`**: Local supermarket and grocery store locator.
9. **`SmartSearchPage.tsx`**: Multi-criteria item and receipt search.
10. **`AuthPage.tsx`**: User login and registration portal.
11. **`PublicLandingPage.tsx`**: Landing page showcasing key features for non-logged-in visitors.
12. **`pages/admin/` (Admin Module)**:
    - **`AdminLoginPage.tsx`**: Secure administrator console login.
    - **`AdminDashboardPage.tsx`**: Platform statistics (total users, receipts, volumes).
    - **`AdminUsersPage.tsx`**: Registered user directory and management.
    - **`AdminReceiptsPage.tsx`**: System-wide receipts audit log.
    - **`AdminReportsPage.tsx`**: Platform-wide financial analytics summary.

---

### 📁 4. `src/components/` - Reusable UI Components
- **`Navbar.tsx`**: Header navigation bar, user profile dropdown, and theme switcher.
- **`Sidebar.tsx`**: Desktop side navigation menu.
- **`MobileBottomNav.tsx`**: Mobile navigation bar.
- **`ReceiptModal.tsx`**: Receipt detail modal popup showing line items, GST, store name, and date.
- **`Logo.tsx`**: Application brand logo.
- **`components/admin/`**: Admin portal layouts and navigation components.

---

### 📁 5. `src/services/` - Backend API Client
- **`api.ts`**: Client HTTP service for receipt saving, fetching, and user settings.
- **`adminApi.ts`**: Client HTTP service for administrator endpoints and secure requests.

---

## 4. Security & Configuration
- All secret keys (such as Gemini API Key and Admin Credentials) are kept strictly server-side.
- The `.env` file allows setting custom environment variables securely.

---
*This documentation provides a comprehensive overview of the Expense Insight Hub architecture and codebase.*
