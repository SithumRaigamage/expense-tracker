const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const ProductBudget = require('../../src/models/ProductBudget');
const User = require('../../src/models/User');
// database.js exports the function directly; destructuring it yielded undefined
// and every test in this file failed before it began.
const connectDB = require('../../src/config/database');

describe('Product Budget API', () => {
  let token;
  let user;
  let productBudgetId;

  beforeAll(async () => {
    await connectDB();
    
    // Create a test user
    await User.deleteMany({});
    user = await User.create({
      name: 'Test User',
      email: 'testproductbudget@example.com',
      password: 'Password123!'
    });

    // Login to get authentication token
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: 'testproductbudget@example.com',
        password: 'Password123!'
      });

    token = res.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ProductBudget.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear product budgets before each test
    await ProductBudget.deleteMany({});
  });

  describe('POST /api/v1/productbudgets', () => {
    it('should create a new product budget', async () => {
      const res = await request(app)
        .post('/api/v1/productbudgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Laptop',
          targetAmount: 1500,
          savedAmount: 500,
          targetDate: new Date().toISOString().split('T')[0],
          imageUrl: 'https://example.com/laptop.jpg'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Laptop');
      expect(res.body.data.user.toString()).toBe(user._id.toString());

      productBudgetId = res.body.data._id;
    });

    it('should not create product budget with invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/productbudgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'TV',
          savedAmount: 100
          // Missing required fields
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/v1/productbudgets', () => {
    it('should get all product budgets for current user', async () => {
      // Create a test product budget first
      await ProductBudget.create({
        name: 'Test Budget',
        targetAmount: 1000,
        savedAmount: 300,
        targetDate: new Date(),
        user: user._id
      });

      const res = await request(app)
        .get('/api/v1/productbudgets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/productbudgets/:id', () => {
    it('should get product budget by id', async () => {
      // Create a test product budget first
      const productBudget = await ProductBudget.create({
        name: 'Single Budget',
        targetAmount: 1000,
        savedAmount: 300,
        targetDate: new Date(),
        user: user._id
      });

      const res = await request(app)
        .get(`/api/v1/productbudgets/${productBudget._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Single Budget');
    });

    it('should not get product budget with invalid id', async () => {
      const res = await request(app)
        .get(`/api/v1/productbudgets/invalidid`)
        .set('Authorization', `Bearer ${token}`);

      // A malformed id is a client error, not a server fault.
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('PUT /api/v1/productbudgets/:id', () => {
    it('should update product budget', async () => {
      // Create a test product budget first
      const productBudget = await ProductBudget.create({
        name: 'Update Budget',
        targetAmount: 1000,
        savedAmount: 300,
        targetDate: new Date(),
        user: user._id
      });

      const res = await request(app)
        .put(`/api/v1/productbudgets/${productBudget._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Budget Name',
          targetAmount: 2000
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Budget Name');
      expect(res.body.data.targetAmount).toBe(2000);
      // Should preserve other fields
      expect(res.body.data.savedAmount).toBe(300);
    });
  });

  describe('DELETE /api/v1/productbudgets/:id', () => {
    it('should delete product budget', async () => {
      // Create a test product budget first
      const productBudget = await ProductBudget.create({
        name: 'Delete Budget',
        targetAmount: 1000,
        savedAmount: 300,
        targetDate: new Date(),
        user: user._id
      });

      const res = await request(app)
        .delete(`/api/v1/productbudgets/${productBudget._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Verify it's deleted
      const found = await ProductBudget.findById(productBudget._id);
      expect(found).toBeNull();
    });
  });

  describe('PATCH /api/v1/productbudgets/:id/amount', () => {
    it('should update saved amount for a product budget', async () => {
      // Create a test product budget first
      const productBudget = await ProductBudget.create({
        name: 'Amount Update Budget',
        targetAmount: 1000,
        savedAmount: 300,
        targetDate: new Date(),
        user: user._id
      });

      const res = await request(app)
        .patch(`/api/v1/productbudgets/${productBudget._id}/amount`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          savedAmount: 500
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.savedAmount).toBe(500);
      // Should preserve other fields
      expect(res.body.data.name).toBe('Amount Update Budget');
    });
  });
});
