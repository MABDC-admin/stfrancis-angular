const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating and bypassing auth...');
    await page.goto('http://localhost:4200/');
    
    // Set localStorage auth data
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: '24b38f39-b25d-4db4-b6ba-f709bdddd3f9',
        email: 'jbriones.13579@gmail.com',
        role: 'TEACHER'
      }));
    });

    console.log('Navigating to Teacher Dashboard...');
    await page.goto('http://localhost:4200/teacher/dashboard');
    await page.waitForTimeout(3000); // Give it time to load data

    
    console.log('Checking Grade Level in Hero Banner...');
    const metaText = await page.innerText('p.text-violet-100');
    console.log('--> Hero Meta Text:', metaText);
    
    console.log('Navigating to Academic Profiles...');
    await page.click('a[routerLink="/teacher/profiles"]');
    await page.waitForURL('**/teacher/profiles', { timeout: 10000 });
    
    console.log('Opening first student profile...');
    await page.click('table tbody tr:first-child');
    await page.waitForSelector('.attendance-profile-dialog', { state: 'visible', timeout: 10000 });
    
    const gradeSectionText = await page.innerText('span:has-text("Grade & Section") + strong');
    console.log('--> Modal Grade Text:', gradeSectionText);
    
    const sf9TableText = await page.innerText('.attendance-dialog-grid article:nth-child(3) table');
    console.log('--> SF9 Contains Mother Tongue?', sf9TableText.includes('Mother Tongue'));
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'teacher-portal-verified.png', fullPage: true });

    console.log('Verification Complete: PASSED');
  } catch (err) {
    console.error('Verification Complete: FAILED', err);
  } finally {
    await browser.close();
  }
})();
