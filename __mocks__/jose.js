// Mock for jose to avoid ES module syntax issues in Jest
module.exports = {
  // Mock the functions we use from jose
  jwtVerify: jest.fn(),
  signJWT: jest.fn(),
  // Add any other exports from jose that are used in the codebase
};