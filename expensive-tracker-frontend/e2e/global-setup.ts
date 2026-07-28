import { request } from '@playwright/test';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

export const STORAGE_STATE = 'e2e/.auth/state.json';

const API = process.env.E2E_API_URL || 'http://localhost:3001/api/v1';
const ORIGIN = process.env.E2E_BASE_URL || 'http://localhost:4200';

/**
 * Signs in once and saves the session for every test to reuse.
 *
 * Each spec used to log in for itself, which meant ~30 logins from one IP in a
 * few seconds — enough to trip the API's brute-force limiter and fail the run
 * with 429s. That limiter is doing its job; the tests were the problem.
 */
export default async function globalSetup() {
  const context = await request.newContext();
  const response = await context.post(`${API}/users/login`, {
    data: {
      email: process.env.E2E_EMAIL || 'sraig2002@gmail.com',
      password: process.env.E2E_PASSWORD || 'sithum123'
    }
  });

  if (!response.ok()) {
    throw new Error(
      `E2E setup: login failed with ${response.status()}. Is the backend running and seeded ` +
      `(npm run seed:user in expensive-tracker-backend)?`
    );
  }

  const { data } = await response.json();

  const state = {
    cookies: [],
    origins: [
      {
        origin: ORIGIN,
        localStorage: [
          { name: 'token', value: data.token },
          { name: 'user', value: JSON.stringify(data.user) }
        ]
      }
    ]
  };

  await mkdir(dirname(STORAGE_STATE), { recursive: true });
  await writeFile(STORAGE_STATE, JSON.stringify(state, null, 2));
  await context.dispose();
}
