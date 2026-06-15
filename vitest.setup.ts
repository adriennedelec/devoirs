import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  window.sessionStorage.setItem('devoirs.adminSession.v1', 'admin');
});

afterEach(() => {
  window.sessionStorage.clear();
});
