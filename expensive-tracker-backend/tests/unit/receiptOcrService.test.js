jest.mock('axios');
jest.mock('fs');
jest.mock('../../src/utils/logger', () => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn() }));

const axios = require('axios');
const fs = require('fs');

// The service reads OCR_API_KEY in its constructor, so we re-require it per test
// with the desired env using jest.isolateModules.
const loadService = () => {
  let svc;
  jest.isolateModules(() => { svc = require('../../src/services/receiptOcrService'); });
  return svc;
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.readFileSync.mockReturnValue(Buffer.from('img-bytes'));
});

describe('ReceiptOcrService.extractText', () => {
  it('reports not-configured and skips the network when no key is set', async () => {
    delete process.env.OCR_API_KEY;
    const service = loadService();

    const result = await service.extractText('/tmp/receipt.jpg');
    expect(result).toEqual({ configured: false, rawText: '' });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('posts the image and returns parsed text when configured', async () => {
    process.env.OCR_API_KEY = 'key-123';
    const service = loadService();
    axios.post.mockResolvedValue({
      data: { IsErroredOnProcessing: false, ParsedResults: [{ ParsedText: 'KEELLS\nTOTAL 1200.00' }] }
    });

    const result = await service.extractText('/tmp/receipt.jpg');
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(result.configured).toBe(true);
    expect(result.rawText).toContain('KEELLS');
  });

  it('degrades to empty text when the provider errors', async () => {
    process.env.OCR_API_KEY = 'key-123';
    const service = loadService();
    axios.post.mockRejectedValue(new Error('provider down'));

    const result = await service.extractText('/tmp/receipt.jpg');
    expect(result).toEqual({ configured: true, rawText: '' });
  });

  it('returns empty text when the provider reports a processing error', async () => {
    process.env.OCR_API_KEY = 'key-123';
    const service = loadService();
    axios.post.mockResolvedValue({ data: { IsErroredOnProcessing: true, ErrorMessage: ['bad image'] } });

    const result = await service.extractText('/tmp/receipt.jpg');
    expect(result.rawText).toBe('');
  });

  afterEach(() => { delete process.env.OCR_API_KEY; });
});
