/**
 * Test setup file for Vitest
 */

// Mock DOM globals that might be needed
global.Date = Date;

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};