const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Runs OCR on a receipt image via a configurable provider and returns the raw
 * text. Defaults to OCR.space (free tier, key via env). Isolated from parsing so
 * the network dependency stays in one place — mirroring currencyService.
 *
 * Configure with:
 *   OCR_API_URL  (default: https://api.ocr.space/parse/image)
 *   OCR_API_KEY  (required to actually call the provider)
 *   OCR_LANGUAGE (default: eng)
 */
class ReceiptOcrService {
  constructor() {
    this.apiUrl = process.env.OCR_API_URL || 'https://api.ocr.space/parse/image';
    this.apiKey = process.env.OCR_API_KEY || null;
    this.language = process.env.OCR_LANGUAGE || 'eng';
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Extract text from an image file on disk.
   * @param {string} filePath - Absolute path to the uploaded image
   * @returns {Promise<{configured: boolean, rawText: string}>}
   */
  async extractText(filePath) {
    if (!this.isConfigured()) {
      logger.warn('OCR_API_KEY not set — receipt OCR is disabled, returning empty text');
      return { configured: false, rawText: '' };
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const mime = this._mimeFromPath(filePath);
      const base64 = `data:${mime};base64,${buffer.toString('base64')}`;

      const params = new URLSearchParams();
      params.append('base64Image', base64);
      params.append('language', this.language);
      params.append('scale', 'true');
      params.append('OCREngine', '2');

      const response = await axios.post(this.apiUrl, params, {
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      const rawText = this._readParsedText(response.data);
      return { configured: true, rawText };
    } catch (error) {
      logger.error('Receipt OCR request failed', { message: error.message });
      // Degrade gracefully: caller still returns the stored receipt URL.
      return { configured: true, rawText: '' };
    }
  }

  _mimeFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
  }

  _readParsedText(data) {
    if (!data) return '';
    if (data.IsErroredOnProcessing) {
      logger.warn('OCR provider reported an error', {
        error: Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join('; ') : data.ErrorMessage
      });
      return '';
    }
    const results = data.ParsedResults;
    if (Array.isArray(results) && results.length) {
      return results.map((r) => r.ParsedText || '').join('\n').trim();
    }
    return '';
  }
}

module.exports = new ReceiptOcrService();
