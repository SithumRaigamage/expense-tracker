const fetch = require('node-fetch');

// Function to test the verify endpoint
async function testVerifyEndpoint(token) {
  try {
    const response = await fetch('http://localhost:3001/api/v1/users/verify', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Verify endpoint response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing verify endpoint:', error);
  }
}

// Get token from command line arguments
const token = process.argv[2];

if (!token) {
  console.error('Please provide a token as a command line argument');
  process.exit(1);
}

console.log('Testing verify endpoint with token:', token);
testVerifyEndpoint(token);
