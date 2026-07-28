/**
 * Keyword → canonical category label map used to auto-classify transactions and
 * receipts. Matching is case-insensitive and substring-based against the source
 * text (merchant name, SMS body, or CSV description). The canonical label is then
 * reconciled against the user's own category names by categoryMatcher.
 *
 * Extend freely — add rows/keywords to improve classification for your banks.
 */
module.exports = {
  Food: ['restaurant', 'cafe', 'coffee', 'food', 'grocery', 'supermarket', 'pizza', 'burger', 'kfc', 'mcdonald', 'dining', 'bakery', 'keells', 'cargills'],
  Transport: ['uber', 'lyft', 'taxi', 'fuel', 'petrol', 'gas station', 'bus', 'train', 'metro', 'parking', 'pickme', 'toll'],
  Shopping: ['amazon', 'mall', 'store', 'shop', 'clothing', 'fashion', 'electronics', 'daraz', 'aliexpress'],
  Utilities: ['electric', 'water board', 'internet', 'wifi', 'broadband', 'mobile', 'recharge', 'utility', 'ceb', 'dialog', 'slt', 'bill payment'],
  Entertainment: ['netflix', 'spotify', 'cinema', 'movie', 'game', 'youtube', 'disney', 'prime video'],
  Health: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'health', 'osusala'],
  Salary: ['salary', 'payroll', 'wage', 'stipend'],
  Rent: ['rent', 'lease', 'landlord', 'housing'],
  Transfer: ['transfer', 'atm', 'cash withdrawal', 'withdrawal']
};
