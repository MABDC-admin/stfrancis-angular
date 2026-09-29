const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in to teacher portal...');
  await page.goto('http://localhost:4200/auth/login');
  await page.fill('input[type="email"]', 'teacher1@sfxsai.com');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button:has-text("Sign in")');

  console.log('Waiting for Teacher Dashboard...');
  try {
    await page.waitForURL('**/teacher/dashboard', { timeout: 10000 });
  } catch (err) {
    console.log('Failed to navigate to dashboard. Taking screenshot...');
    await page.screenshot({ path: 'login-failed.png' });
    throw err;
  }
  
  // Wait for network requests to finish
  await page.waitForLoadState('networkidle');

  console.log('Extracting Subjects / Classes assigned to Teacher...');
  const subjects = await page.locator('.mini-calendar > div > strong').allTextContents();
  const sections = await page.locator('.mini-calendar > div > small').allTextContents();
  
  console.log('\n--- VERIFICATION RESULTS ---');
  if (subjects.length > 0) {
    console.log('Assigned Subjects:', subjects);
    console.log('Assigned Sections:', sections);
    if (sections.some(g => g.includes('Grade 1')) || subjects.some(s => s.includes('Grade 1'))) {
      console.log('✅ SUCCESS: Grade 1 subjects successfully populated in the Teacher Portal from the new Drizzle ORM backend!');
    } else {
      console.log('⚠️ Warning: Grade 1 subjects not found.');
    }
  } else {
    console.log('❌ Error: No subjects populated in the portal.');
  }

  await browser.close();
})();
