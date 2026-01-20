/**
 * Custom middleware for handling CORS specifically for images
 * This ensures images can be loaded from the expensive-tracker-frontend without CORS errors
 */
module.exports = (req, res, next) => {
  // Set permissive CORS headers for image files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // For image files, also set cache control headers for better performance
  if (req.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('Vary', 'Origin');
  }
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};
