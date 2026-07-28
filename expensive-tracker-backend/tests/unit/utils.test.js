const errors = require('../../src/utils/errors');
const { successResponse, createdResponse, errorResponse, paginatedResponse, noContentResponse } = require('../../src/utils/responseFormatter');

// Minimal Express response double.
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('error classes', () => {
  it('carry the correct status codes and default messages', () => {
    expect(new errors.NotFoundError().statusCode).toBe(404);
    expect(new errors.ValidationError().statusCode).toBe(400);
    expect(new errors.UnauthorizedError().statusCode).toBe(401);
    expect(new errors.ForbiddenError().statusCode).toBe(403);
    expect(new errors.BadRequestError().statusCode).toBe(400);
    expect(new errors.ConflictError().statusCode).toBe(409);
  });

  it('are operational and preserve custom messages', () => {
    const err = new errors.NotFoundError('Widget not found');
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe('Widget not found');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('responseFormatter', () => {
  it('successResponse sends success:true with data and optional message', () => {
    const res = mockRes();
    successResponse(res, { a: 1 }, 200, 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'ok', data: { a: 1 } });
  });

  it('successResponse omits data when null', () => {
    const res = mockRes();
    successResponse(res, null);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('createdResponse uses 201', () => {
    const res = mockRes();
    createdResponse(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('errorResponse sends success:false with error and details', () => {
    const res = mockRes();
    errorResponse(res, 'nope', 422, { field: 'x' });
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'nope', details: { field: 'x' } });
  });

  it('paginatedResponse computes pagination metadata', () => {
    const res = mockRes();
    paginatedResponse(res, [1, 2], 1, 2, 5);
    const body = res.json.mock.calls[0][0];
    expect(body.total).toBe(5);
    expect(body.pagination).toMatchObject({ page: 1, pages: 3, hasNext: true, hasPrev: false });
  });

  it('noContentResponse sends 204', () => {
    const res = mockRes();
    noContentResponse(res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
