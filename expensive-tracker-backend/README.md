# Expense Tracker Backend

A RESTful API for managing personal expenses built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **Expense Management**: Create, read, update, and delete expenses
- **Category Management**: Organize expenses with custom categories
- **Data Analytics**: Get insights and statistics about spending patterns
- **File Upload**: Upload receipt images for expenses
- **Data Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Centralized error handling with meaningful messages
- **Security**: Rate limiting, CORS, helmet protection, and more

## 📁 Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Route controllers (business logic)
├── middleware/      # Custom middleware functions
├── models/         # Database models (Mongoose schemas)
├── routes/         # API route definitions
├── services/       # Business logic and external service integrations
├── utils/          # Utility functions and helpers
├── validators/     # Input validation schemas
├── app.js          # Express app configuration
└── server.js       # Server entry point

tests/
├── unit/           # Unit tests
└── integration/    # Integration tests

docs/               # API documentation
logs/               # Application logs
```

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd expensive-tracker-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration.

4. Start MongoDB service on your machine

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/logout` - Logout user

### User Profile
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/profile` - Delete user account

### Expenses
- `GET /api/v1/expenses` - Get all expenses (with pagination and filters)
- `POST /api/v1/expenses` - Create a new expense
- `GET /api/v1/expenses/:id` - Get expense by ID
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense
- `GET /api/v1/expenses/stats/summary` - Get expense statistics

### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create a new category
- `GET /api/v1/categories/:id` - Get category by ID
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚦 Development

```bash
# Start development server with nodemon
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- MongoDB injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
