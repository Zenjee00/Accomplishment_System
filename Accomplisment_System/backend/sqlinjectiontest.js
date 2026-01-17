const axios = require("axios");

// SQL Injection Test Cases
const maliciousInputs = [
  "' OR '1'='1", // Basic injection
  "'; DROP TABLE users--", // Destructive injection
  "' UNION SELECT * FROM users--", // Union injection
  "admin' --", // Comment injection
  "' OR 1=1; --", // Chained injection
];

// Test Login Endpoint
const testLoginInjection = async () => {
  for (const injection of maliciousInputs) {
    try {
      const response = await axios.post("http://localhost:1010/login", {
        email: `test@test.com${injection}`,
        password: injection,
      });
      console.log(`Vulnerable to injection: ${injection}`);
      console.log(response.data);
    } catch (error) {
      console.log(`Injection failed: ${injection}`);
    }
  }
};

// Test Users Endpoint
const testUsersInjection = async () => {
  try {
    const response = await axios.get(
      `http://localhost:1010/users?id=1${maliciousInputs[0]}`
    );
    console.log("Vulnerable to injection in users endpoint");
    console.log(response.data);
  } catch (error) {
    console.log("Users endpoint injection failed");
  }
};

// Test Bookings Endpoint
const testBookingsInjection = async () => {
  try {
    const response = await axios.get(
      `http://localhost:1010/bookings?venue_id=1${maliciousInputs[0]}`
    );
    console.log("Vulnerable to injection in bookings endpoint");
    console.log(response.data);
  } catch (error) {
    console.log("Bookings endpoint injection failed");
  }
};

// Run tests
const runTests = async () => {
  console.log("Testing Login Endpoint for SQL Injection...");
  await testLoginInjection();
  console.log("Testing Users Endpoint for SQL Injection...");
  await testUsersInjection();
  console.log("Testing Bookings Endpoint for SQL Injection...");
  await testBookingsInjection();
};

runTests();