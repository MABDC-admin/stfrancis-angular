import { test, expect } from '@playwright/test';

test('screenshot teacher portal', async ({ page }) => {
  // Login as teacher
  await page.goto('http://localhost:4200/login');
  
  // Set auth token directly
  await page.evaluate(() => {
    localStorage.setItem('sfxsai.auth.token', 'dummy_token_for_playwright');
    localStorage.setItem('user', JSON.stringify({
      id: 'teacher1',
      email: 'teacher1@sfxsai.com',
      role: 'TEACHER'
    }));
  });

  await page.goto('http://localhost:4200/teacher');
  await page.waitForTimeout(3000); // Wait for rendering
  await page.screenshot({ path: 'teacher_portal_screenshot.png', fullPage: true });
});
