jest.mock('../../src/models/User');
jest.mock('jsonwebtoken');

const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');
const UserService = require('../../src/services/userService');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  jwt.sign.mockReturnValue('signed.jwt.token');
});

describe('UserService.generateToken', () => {
  it('signs the user id with the configured secret', () => {
    const token = UserService.generateToken('u1');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 'u1' }, 'test-secret', expect.objectContaining({ expiresIn: expect.any(String) }));
    expect(token).toBe('signed.jwt.token');
  });
});

describe('UserService.register', () => {
  it('throws ConflictError when the email is already taken', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });
    await expect(UserService.register({ email: 'a@b.com', password: 'x', name: 'A' }))
      .rejects.toThrow('already exists');
    expect(User.create).not.toHaveBeenCalled();
  });

  it('creates the user, defaults currency to LKR, and returns a token', async () => {
    User.findOne.mockResolvedValue(null);
    const save = jest.fn().mockResolvedValue({});
    User.create.mockResolvedValue({ _id: 'u1', name: 'A', email: 'a@b.com', currency: 'LKR', save });

    const result = await UserService.register({ email: 'a@b.com', password: 'x', name: 'A' });

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ currency: 'LKR' }));
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user).toMatchObject({ id: 'u1', email: 'a@b.com' });
  });
});

describe('UserService.login', () => {
  const buildUser = (overrides = {}) => {
    const user = {
      _id: 'u1', name: 'A', email: 'a@b.com', currency: 'LKR', isActive: true, role: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue({}),
      ...overrides
    };
    return user;
  };

  const mockFindOneWithPassword = (user) => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
  };

  it('throws on unknown email', async () => {
    mockFindOneWithPassword(null);
    await expect(UserService.login('none@b.com', 'x')).rejects.toThrow('Invalid credentials');
  });

  it('throws when the account is deactivated', async () => {
    mockFindOneWithPassword(buildUser({ isActive: false }));
    await expect(UserService.login('a@b.com', 'x')).rejects.toThrow('deactivated');
  });

  it('throws on wrong password', async () => {
    mockFindOneWithPassword(buildUser({ comparePassword: jest.fn().mockResolvedValue(false) }));
    await expect(UserService.login('a@b.com', 'bad')).rejects.toThrow('Invalid credentials');
  });

  it('returns user + token on success', async () => {
    const user = buildUser();
    mockFindOneWithPassword(user);
    const result = await UserService.login('a@b.com', 'right');
    expect(user.save).toHaveBeenCalled(); // updates lastLogin
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user.id).toBe('u1');
  });
});

describe('UserService.getProfile / verifyToken', () => {
  it('getProfile throws NotFoundError when the user is gone', async () => {
    User.findById.mockResolvedValue(null);
    await expect(UserService.getProfile('u1')).rejects.toThrow('User not found');
  });

  it('verifyToken returns public user data with valid:true', async () => {
    User.findById.mockResolvedValue({ _id: 'u1', name: 'A', email: 'a@b.com', isActive: true, role: 'user' });
    const result = await UserService.verifyToken('u1');
    expect(result.valid).toBe(true);
    expect(result.user.id).toBe('u1');
  });
});
