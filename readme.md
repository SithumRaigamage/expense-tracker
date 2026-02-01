# 💰 Expense Tracker Application

<p align="center">
  <img src="https://raw.githubusercontent.com/SithumRaigamage/expense-tracker/main/expensive-tracker-frontend/src/favicon.png" alt="Expense Tracker Logo" width="120"/>
</p>

<p align="center">
  <strong>A premium, modern personal finance management system.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-19.1.0-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0.14-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-4.4+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
</p>

---

## 📋 Overview

The **Expense Tracker** is a full-stack, state-of-the-art financial management tool. It features a highly polished, glassmorphic UI, robust security with JWT, and comprehensive expense analytics. Designed with a mobile-first approach, it provides a seamless experience for tracking spending habits, managing complex multi-wallet flows, and monitoring financial goals through a dedicated product budgeting system.

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 19 (Standalone Components)
- **Styling:** Tailwind CSS 4 (Theme-driven, CSS-first optimization)
- **Icons:** FontAwesome 6+
- **Charts:** ApexCharts & ECharts for rich visual analytics (Flow, Gauge, and Trend charts)

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Security:** JWT Authentication, Bcryptjs, Helmet, Express-Validator
- **External Integration:** Real-time Exchange Rate API for multi-currency support

### CI/CD & Quality
- **Analysis:** SonarQube & SonarLint
- **Scanning:** Trivy Container Vulnerability Scanning
- **Testing:** Karma & Jasmine (Frontend), Jest (Backend)

## ✨ Features

- 👤 **Advanced Authentication:** Secure Login/Register with reactive validation and password visibility toggles.
- 🎨 **Premium UI/UX:** Glassmorphic card designs, smooth micro-animations, and a harmonized brand identity.
- 💳 **Wallet & Account Management:** Manage multiple wallets with native currency support and atomic fund transfers.
- 🌊 **Financial Flow Analysis:** Sophisticated Sankey-style data visualization of money flow from wallets to expense categories.
- 🎯 **Product Budgets (Savings Goals):** Dedicated system to track progress towards specific purchase goals with target vs. saved amount monitoring.
- 🌍 **Automated Multi-Currency:** Real-time exchange rate fetching and automatic currency conversion (USD/LKR/EUR/etc.) for global finance tracking.
- 📊 **Dynamic Analytics:** Monthly spending statistics, wallet flow insights, and visual progress gauges for your savings.
- 📝 **Release Repository:** Admin-controlled release notes and changelog tracking via a managed central repository.

## 🗂️ Project Structure

```bash
expense-tracker/
├── 📂 expensive-tracker-frontend/ # Angular 19 SPA
│   ├── 📂 src/app/
│   │   ├── 📂 auth/               # Auth module (Login/Register)
│   │   ├── 📂 main-layout/        # Dashboard & Navigation
│   │   ├── 📂 shared/             # Reusable UI components
│   │   └── 📂 services/           # API integration
├── 📂 expensive-tracker-backend/  # Node.js API
│   ├── 📂 src/
│   │   ├── 📂 controllers/        # Business logic controllers
│   │   ├── 📂 models/             # Mongoose schemas (Wallet, Expense, ProductBudget, etc.)
│   │   ├── 📂 routes/             # API entry points
│   │   └── 📂 services/           # Core service layer (Sankey Flow, Currency, Wallet services)
└── 📝 README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB running locally or on Atlas

### Quick Start

1. **Clone & Setup:**
   ```bash
   git clone https://github.com/SithumRaigamage/expense-tracker.git
   cd expense-tracker
   ```

2. **Backend Setup:**
   ```bash
   cd expensive-tracker-backend
   npm install
   npm run dev  # Starts server and seeds initial data (User, Release Notes, etc.)
   ```

3. **Frontend Setup:**
   ```bash
   cd ../expensive-tracker-frontend
   npm install
   npm run start # Launches dev server at http://localhost:4200
   ```

## 🐳 Containerization & Security

The application is fully containerized for production deployment.

```bash
# Build and Scan Frontend
cd expensive-tracker-frontend
docker build -t expense-tracker:2.0.0 .
trivy image expense-tracker:2.0.0
```

## 📈 Roadmap

- [x] Angular 19 Upgrade
- [x] Tailwind CSS 4 Integration
- [x] Refactored Auth UI/UX
- [x] Multi-Currency Support (Automated)
- [x] Product Budgeting & Savings Tracking
- [x] Real-time Financial Flow Visualization
- [/] AI-driven spending insights & predictions
- [ ] Automated financial report generation (PDF/Excel)
- [ ] Push notifications for budget thresholds

---
<p align="center">
  Developed by <strong>Sithum Raigamage</strong><br>
  <a href="https://github.com/SithumRaigamage">GitHub</a> • <a href="https://linkedin.com/in/sithum-raigamage">LinkedIn</a>
</p>
