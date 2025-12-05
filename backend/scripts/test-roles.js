const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Test credentials (you'll need to create these users first)
const HOST_CREDS = { username: 'host1', password: 'password123' };
const ADMIN_CREDS = { username: 'admin1', password: 'password123' };
const USER_CREDS = { username: 'user1', password: 'password123' };

let hostToken, adminToken, userToken;

async function login(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${credentials.username}:`, error.response?.data || error.message);
    return null;
  }
}

async function testEndpoint(token, method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { Authorization: `Bearer ${token}` }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    if (status === expectedStatus) {
      console.log(`✅ ${method} ${endpoint} - Expected ${expectedStatus}, got ${status}`);
    } else {
      console.log(`❌ ${method} ${endpoint} - Expected ${expectedStatus}, got ${status}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Role-Based Access Control Tests\n');
  
  // Login all users
  console.log('📝 Logging in users...');
  hostToken = await login(HOST_CREDS);
  adminToken = await login(ADMIN_CREDS);
  userToken = await login(USER_CREDS);
  
  if (!hostToken || !adminToken || !userToken) {
    console.log('❌ Failed to login all users. Please ensure test users exist.');
    return;
  }
  
  console.log('✅ All users logged in successfully\n');
  
  // Test User Management (HOST only)
  console.log('👥 Testing User Management...');
  await testEndpoint(hostToken, 'GET', '/users', null, 200);
  await testEndpoint(adminToken, 'GET', '/users', null, 403);
  await testEndpoint(userToken, 'GET', '/users', null, 403);
  
  // Test User Creation (HOST only)
  const newUser = { username: 'testuser', password: 'test123', role: 'USER' };
  await testEndpoint(hostToken, 'POST', '/users', newUser, 201);
  await testEndpoint(adminToken, 'POST', '/users', newUser, 403);
  await testEndpoint(userToken, 'POST', '/users', newUser, 403);
  
  console.log();
  
  // Test Call Management
  console.log('📞 Testing Call Management...');
  
  // All roles can create calls
  const testCall = {
    customerName: 'Test Customer',
    phone: '1234567890',
    problem: 'Test problem',
    category: 'Technical Issue'
  };
  
  await testEndpoint(hostToken, 'POST', '/calls', testCall, 201);
  await testEndpoint(adminToken, 'POST', '/calls', testCall, 201);
  await testEndpoint(userToken, 'POST', '/calls', testCall, 201);
  
  // Get calls (different visibility per role)
  console.log('\n📋 Testing Call Visibility...');
  const hostCalls = await testEndpoint(hostToken, 'GET', '/calls', null, 200);
  const adminCalls = await testEndpoint(adminToken, 'GET', '/calls', null, 200);
  const userCalls = await testEndpoint(userToken, 'GET', '/calls', null, 200);
  
  console.log(`HOST sees ${hostCalls?.length || 0} calls`);
  console.log(`ADMIN sees ${adminCalls?.length || 0} calls`);
  console.log(`USER sees ${userCalls?.length || 0} calls`);
  
  // Test call assignment (HOST/ADMIN only)
  if (hostCalls && hostCalls.length > 0) {
    const callId = hostCalls[0].id;
    console.log('\n🎯 Testing Call Assignment...');
    await testEndpoint(hostToken, 'POST', `/calls/${callId}/assign`, { assignee: 'user1' }, 200);
    await testEndpoint(adminToken, 'POST', `/calls/${callId}/assign`, { assignee: 'user1' }, 200);
    await testEndpoint(userToken, 'POST', `/calls/${callId}/assign`, { assignee: 'user1' }, 403);
  }
  
  // Test call completion
  if (hostCalls && hostCalls.length > 0) {
    const callId = hostCalls[0].id;
    console.log('\n✅ Testing Call Completion...');
    await testEndpoint(hostToken, 'POST', `/calls/${callId}/complete`, null, 200);
    await testEndpoint(adminToken, 'POST', `/calls/${callId}/complete`, null, 200);
    await testEndpoint(userToken, 'POST', `/calls/${callId}/complete`, null, 200);
  }
  
  // Test call editing (HOST only)
  if (hostCalls && hostCalls.length > 1) {
    const callId = hostCalls[1].id;
    const updateData = { problem: 'Updated problem description' };
    console.log('\n✏️ Testing Call Editing...');
    await testEndpoint(hostToken, 'PUT', `/calls/${callId}`, updateData, 200);
    await testEndpoint(adminToken, 'PUT', `/calls/${callId}`, updateData, 403);
    await testEndpoint(userToken, 'PUT', `/calls/${callId}`, updateData, 403);
  }
  
  console.log('\n🎉 Role-Based Access Control Tests Completed!');
}

runTests().catch(console.error);