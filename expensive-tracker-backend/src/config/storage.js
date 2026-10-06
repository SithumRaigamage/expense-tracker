const path = require('path');

/**
 * Where uploaded files live, resolved once to absolute paths.
 *
 * multer used FILE_UPLOAD_PATH relative to the working directory while the
 * static handler used a path relative to this source tree; started from another
 * directory, files were written somewhere that was never served. Everything
 * that touches the disk reads these constants instead.
 */
const BACKEND_ROOT = path.resolve(__dirname, '../..');

/** Profile pictures. Served publicly under PUBLIC_UPLOAD_PREFIX. */
const UPLOAD_DIR = path.resolve(BACKEND_ROOT, process.env.FILE_UPLOAD_PATH || 'public/uploads');

/**
 * Receipt images. Private: deliberately outside the static root and served only
 * by an authenticated route that checks ownership. Receipts carry merchant
 * names, amounts and card fragments; they used to sit in the public uploads
 * folder, readable by anyone holding the URL (audit finding H4).
 */
const RECEIPT_DIR = path.resolve(BACKEND_ROOT, process.env.RECEIPT_UPLOAD_PATH || 'storage/receipts');

/** Authenticated route that serves a user's own receipts. */
const RECEIPT_URL_PREFIX = '/api/v1/expenses/receipts/';

/** URL prefix the public upload directory is mounted at. */
const PUBLIC_UPLOAD_PREFIX = '/uploads/';

/**
 * Resolves a stored file name to an absolute path inside `dir`, or null if it
 * would land anywhere else.
 *
 * Only the final path segment of `name` is used, so a value such as
 * "http://host/uploads/../../.env" reduces to ".env" and is looked up *inside*
 * `dir` — never outside it. The containment check is kept as a second guard
 * rather than trusting basename alone.
 */
const resolveInside = (dir, name) => {
  if (typeof name !== 'string' || name.length === 0) {
    return null;
  }

  const fileName = path.basename(name.split(/[?#]/)[0]);
  if (!fileName || fileName === '.' || fileName === '..') {
    return null;
  }

  const resolved = path.resolve(dir, fileName);
  return resolved.startsWith(dir + path.sep) ? resolved : null;
};

/**
 * Root-relative URL for a public upload. Relative on purpose: it is correct
 * behind any host, port, scheme or proxy, which an absolute URL built from the
 * request was not.
 */
const publicUploadUrl = (fileName) => `${PUBLIC_UPLOAD_PREFIX}${fileName}`;

const receiptUrl = (fileName) => `${RECEIPT_URL_PREFIX}${fileName}`;

/**
 * Upload names are generated as `<userId>-<uuid>.<ext>` (middleware/fileUpload),
 * so ownership can be read from the name without a database lookup.
 */
const isOwnedBy = (fileName, userId) =>
  typeof fileName === 'string' && Boolean(userId) && path.basename(fileName).startsWith(`${userId}-`);

module.exports = {
  UPLOAD_DIR,
  RECEIPT_DIR,
  PUBLIC_UPLOAD_PREFIX,
  RECEIPT_URL_PREFIX,
  resolveInside,
  publicUploadUrl,
  receiptUrl,
  isOwnedBy
};
