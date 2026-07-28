const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Wallet = require('../../src/models/Wallet');
const mongoose = require('mongoose');

// Mock data
const userData = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123'
};

const walletData = {
  name: 'Test Wallet',
  type: 'bank',
  balance: 1000,
  currency: 'USD',
  paymentMethod: 'Credit Card'
};

describe('Wallet CRUD Operations', () => {
  let authToken;
  let userId;
  let walletId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/expense-tracker-test');
  });

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});
    await Wallet.deleteMany({});

    // Create test user
    const userResponse = await request(app)
      .post('/api/v1/users/register')
      .send(userData);

    authToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/wallets', () => {
    it('should create a new wallet', async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(walletData.name);
      expect(response.body.data.type).toBe(walletData.type);
      expect(response.body.data.balance).toBe(walletData.balance);
      expect(response.body.data.user).toBe(userId);
      
      walletId = response.body.data._id;
    });

    it('should not create wallet with duplicate name', async () => {
      // Create first wallet
      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      // Try to create second wallet with same name
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData)
        .expect(409); // duplicate resource -> Conflict

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'bank' }) // Missing name
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate wallet type', async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, type: 'invalid-type' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should not allow negative balance', async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, balance: -100 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/wallets', () => {
    beforeEach(async () => {
      // Create test wallets
      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, name: 'Test Wallet 2', type: 'cash' });
    });

    it('should get all wallets for user', async () => {
      const response = await request(app)
        .get('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter wallets by type', async () => {
      const response = await request(app)
        .get('/api/v1/wallets?type=cash')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].type).toBe('cash');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/wallets?limit=1&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/v1/wallets/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);
      
      walletId = response.body.data._id;
    });

    it('should get wallet by id', async () => {
      const response = await request(app)
        .get(`/api/v1/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(walletId);
      expect(response.body.data.name).toBe(walletData.name);
    });

    it('should return 404 for non-existent wallet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/wallets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Wallet not found');
    });

    it('should return 400 for invalid wallet id', async () => {
      const response = await request(app)
        .get('/api/v1/wallets/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('PUT /api/v1/wallets/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);
      
      walletId = response.body.data._id;
    });

    it('should update wallet', async () => {
      const updateData = {
        name: 'Updated Wallet',
        balance: 2000
      };

      const response = await request(app)
        .put(`/api/v1/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.balance).toBe(updateData.balance);
    });

    it('should not update to duplicate name', async () => {
      // Create another wallet
      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, name: 'Another Wallet' });

      const response = await request(app)
        .put(`/api/v1/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Another Wallet' })
        .expect(409); // duplicate resource -> Conflict

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 404 for non-existent wallet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/wallets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/wallets/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);
      
      walletId = response.body.data._id;
    });

    it('should delete wallet (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/v1/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify wallet is soft deleted
      const wallet = await Wallet.findById(walletId);
      expect(wallet.isActive).toBe(false);
    });

    it('should return 404 for non-existent wallet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/wallets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/wallets/stats', () => {
    beforeEach(async () => {
      // Create test wallets with different types and balances
      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, type: 'bank', balance: 1000 });

      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, name: 'Cash Wallet', type: 'cash', balance: 500 });
    });

    it('should get wallet statistics', async () => {
      const response = await request(app)
        .get('/api/v1/wallets/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byType).toHaveLength(2);
      // totalBalance is converted to the user's primary currency using live/
      // fallback exchange rates, so assert it's a positive number rather than a
      // rate-dependent exact value.
      expect(response.body.data.overall.totalBalance).toBeGreaterThan(0);
      expect(response.body.data.overall.totalWallets).toBe(2);
    });
  });

  describe('DELETE /api/v1/wallets/bulk', () => {
    let walletIds = [];

    beforeEach(async () => {
      // Create multiple wallets
      const wallet1 = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      const wallet2 = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...walletData, name: 'Wallet 2' });

      walletIds = [wallet1.body.data._id, wallet2.body.data._id];
    });

    it('should bulk delete wallets', async () => {
      const response = await request(app)
        .delete('/api/v1/wallets/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ walletIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(2);

      // Verify wallets are soft deleted
      const wallets = await Wallet.find({ _id: { $in: walletIds } });
      wallets.forEach(wallet => {
        expect(wallet.isActive).toBe(false);
      });
    });

    it('should validate walletIds array', async () => {
      const response = await request(app)
        .delete('/api/v1/wallets/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('array of wallet IDs');
    });
  });

  describe('PATCH /api/v1/wallets/:id/restore', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);
      
      walletId = response.body.data._id;

      // Soft delete the wallet
      await request(app)
        .delete(`/api/v1/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should restore deleted wallet', async () => {
      const response = await request(app)
        .patch(`/api/v1/wallets/${walletId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should not restore if active wallet with same name exists', async () => {
      // Create another wallet with same name
      await request(app)
        .post('/api/v1/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      const response = await request(app)
        .patch(`/api/v1/wallets/${walletId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409); // duplicate active name -> Conflict

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });
});
