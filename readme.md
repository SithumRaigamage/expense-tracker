# 💰 Expense Tracker Application

<p align="center">
  <img src="" alt="Expense Tracker Logo" width="200"/>
</p>

[![Angular](https://img.shields.io/badge/Angular-16+-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📋 Overview

A modern expense tracking application built with Angular, designed to help users manage their personal finances effectively. Track expenses, manage payment methods, and maintain user profiles with ease.

## 🛠️ Tech Stack

### Frontend
- ![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white) Angular 16+
- ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) TypeScript
- ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) Tailwind CSS

### Testing & Quality
- ![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white) Karma & Jasmine
- ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white) ESLint

### CI/CD
- ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white) GitHub Actions

## ✨ Features

### 👤 User Management
- Profile management with image upload
- Secure authentication (JWT)
- Password & email management
- Dark/Light theme preferences

### 💳 Payment Methods
- Multiple card support (Visa/Mastercard)
- Secure card management
- Default payment settings

### 📝 Release Notes Management

- Role-based access control (Admin/User)
- Version tracking with semantic versioning
- Detailed changelog including features, bug fixes, and improvements
- Admin dashboard for managing release information

### 🎨 UI/UX Features

- 📱 Responsive design
- 🌓 Dark/Light themes
- ✅ Form validation
- 🔄 Loading states
- ⚡ Modern interface

## 🗂️ Project Structure

```
expense-tracker/
├── 📱 frontend/
│   ├── 📂 src/
│   │   ├── 🧩 components/
│   │   ├── ⚙️ services/
│   │   ├── 📋 models/
│   │   └── 🔧 shared/
│   ├── 📦 package.json
│   └── ⚡ karma.conf.js
└── 📋 README.md
```

## 🚀 Getting Started

### Prerequisites

- ![Node.js](https://img.shields.io/badge/Node.js-16.x_|_18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
- ![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
- ![Angular CLI](https://img.shields.io/badge/Angular_CLI-DD0031?style=for-the-badge&logo=angular&logoColor=white)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/expense-tracker.git

# Navigate to frontend directory
cd expense-tracker/frontend

# Install dependencies
npm install

# Start development server
ng serve

# Seed the database with sample release notes (optional)
cd ../expensive-tracker-backend
node scripts/seedReleaseNotes.js
```


## Database 
```
mongod-start

mongod-stop
```

## 🐳 Containerization

### Frontend Container

```bash
# Build frontend Docker image
cd frontend
docker build -t expense-tracker:1.0.3 .

# Run frontend container
docker run -d -p 4200:80 --name expense-tracker-frontend expense-tracker:1.0.3
```

### Security Scanning

We use Trivy for container security scanning:

```bash
# Scan Docker image for vulnerabilities
trivy image expense-tracker:1.0.3

# Export scan results
trivy image expense-tracker:1.0.3 -f json -o ./docs/trivy-reports/vulnerabilities.json
```

## � Project Documentation

- [Release Notes API](./expensive-tracker-backend/docs/release-notes-api.md)
- [Wallet API](./expensive-tracker-backend/docs/wallet-api.md)
- [Product Budget API](./expensive-tracker-backend/docs/product-budget-api.md)
- [Frontend Documentation](./frontend/docs/docs.md)
- [Docker Setup](./frontend/README.md#docker)
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Generate coverage report
npm run test:coverage

# Run linting
npm run lint
```

## SonarQube Setup

1. Copy configuration templates:
   ```bash
   cp sonar-project.properties.template sonar-project.properties
   ```

2. Set your SonarQube token:
   ```bash
   export SONAR_TOKEN=your_token_here
   ```

3. Update `sonar-project.properties` with your specific configuration

4. Install VS Code SonarLint extension

## 📚 Documentation

- [Release Notes API](./expensive-tracker-backend/docs/release-notes-api.md)
- [Wallet API](./expensive-tracker-backend/docs/wallet-api.md)
- [Product Budget API](./expensive-tracker-backend/docs/product-budget-api.md)

## 📚 Learning Outcomes

- ⚡ Angular component architecture
- 🔄 Reactive programming patterns
- 🎨 Modern CSS with Tailwind
- 🔒 Security best practices
- 📱 Responsive design techniques
- 🧪 Testing methodologies

## 🤝 Contributing

1. Fork it (https://github.com/yourusername/expense-tracker/fork)
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -am 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Create a Pull Request

## 📅 Roadmap

- [x] User authentication
- [x] Payment method management
- [x] Dark/Light theme
- [x] Release notes management
- [ ] Expense categories
- [ ] Budget tracking
- [ ] Financial reports
- [ ] Multi-currency support

## 📫 Contact

<p align="center">
  <a href="https://twitter.com/yourusername">
    <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter"/>
  </a>
  <a href="https://linkedin.com/in/yourusername">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
</p>



---
<p align="center">Made with ❤️ by Sithum Raigamage</p>
