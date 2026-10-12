import { request, FullConfig } from '@playwright/test';
import { rmSync } from 'fs';

export const KATA_SANDI_E2E = 'e2e-3putra';
export const FILE_SESI = 'tests/e2e/.auth/admin.json';

// /admin sekarang wajib login. Masuk sekali di sini, semua tes memakai cookie yang sama.
export default async function globalSetup(config: FullConfig) {
  rmSync('.data-e2e', { recursive: true, force: true });
  const baseURL = config.projects[0].use.baseURL;
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post('/api/admin/masuk', { data: { password: KATA_SANDI_E2E } });
  if (!res.ok()) throw new Error(`Login e2e gagal: ${res.status()} ${await res.text()}`);
  await ctx.storageState({ path: FILE_SESI });
  await ctx.dispose();
}
