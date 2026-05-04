// jest.setup.js
// Set up global Request and Headers for fetch API (needed for jsdom)
import { Request, Headers } from 'whatwg-fetch';

global.Request = Request;
global.Headers = Headers;

// If you need to set environment variables for the tests, you can do it here
// For example, if the code uses process.env.NEXTAUTH_URL
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL='http:/...3000';
}

// Import jest-dom to add custom matchers like toHaveClass, toBeInTheDocument, etc.
import '@testing-library/jest-dom';