import { test, expect } from '@playwright/test';

test('Teacher Portal displays Grade 1 and exact SF9 subjects', async ({ page }) => {
  // Increase test timeout
  test.setTimeout(60000);

  console.log('Navigating to login...');
  await page.goto('http://localhost:4200/auth/login');

  // Wait for the login form to become visible (5s timeout in component)
  await page.waitForSelector('form[name="loginForm"]', { state: 'visible', timeout: 15000 });
  
  // Fill the credentials
  await page.fill('input[type="email"]', 'jbriones.13579@gmail.com');
  await page.fill('input[type="password"]', 'password'); // Most seeds use 'password'

  // Click login
  console.log('Logging in...');
  await page.click('button[type="submit"]');

  // Wait for the dashboard to load
  await page.waitForURL('**/teacher/dashboard', { timeout: 15000 });
  console.log('Logged into dashboard.');

  // Check the Hero banner meta for Grade 1
  const metaText = await page.locator('.hero-meta').innerText();
  console.log('Hero Meta Text:', metaText);
  expect(metaText).toContain('Grade 1');

  // Navigate to Academic Profiles tab
  await page.click('a[routerLink="/teacher/profiles"]');
  await page.waitForURL('**/teacher/profiles', { timeout: 10000 });
  
  // Click on the first student in the table
  console.log('Opening first student academic profile...');
  await page.click('table tbody tr:first-child');
  
  // Wait for the Academic Profile modal to appear
  await page.waitForSelector('.attendance-profile-dialog', { state: 'visible' });

  // Verify modal says Grade 1
  const gradeSectionText = await page.locator('span:has-text("Grade & Section") + strong').innerText();
  console.log('Modal Grade text:', gradeSectionText);
  expect(gradeSectionText).toContain('Grade 1');

  // Verify that "Mother Tongue" is among the subjects in the SF9 table
  const sf9TableText = await page.locator('table').first().innerText();
  console.log('SF9 Table subjects snippet found:', sf9TableText.includes('Mother Tongue'));
  expect(sf9TableText).toContain('Mother Tongue');

  console.log('Verification passed!');
});
