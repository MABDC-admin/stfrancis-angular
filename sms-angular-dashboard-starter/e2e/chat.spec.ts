import { test, expect } from '@playwright/test';

test.describe('Floating Chat UI Verification', () => {
  test('should render the floating chat compactly and display contacts', async ({ page }) => {
    // Navigate to a blank page first to set localStorage
    await page.goto('http://localhost:4200/');

    // Set local storage to bypass login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ email: 'student1@sfxsai.com', role: 'STUDENT', name: 'Test Student' }));
      localStorage.setItem('token', 'dummy-token');
    });

    // Mock the staff contacts endpoint
    await page.route('**/chat/staff-contacts', async route => {
      const json = [
        { id: 't1', displayName: 'Mr. Math', role: 'TEACHER', assignedGradeLevel: 'G7', unreadCount: 0 },
        { id: 't2', displayName: 'Ms. Science', role: 'TEACHER', assignedGradeLevel: 'G7', unreadCount: 2 }
      ];
      await route.fulfill({ json });
    });

    // Mock other chat endpoints
    await page.route('**/chat/unread-count', async route => {
      await route.fulfill({ json: { unreadCount: 2 } });
    });
    
    await page.route('**/chat/my-conversation', async route => {
      await route.fulfill({ json: { id: 'c1', subject: 'Support', status: 'OPEN', messages: [] } });
    });

    // Reload the page to the dashboard so auth guard passes and component loads
    await page.goto('http://localhost:4200/student/dashboard');

    // Wait for the floating chat launcher to appear
    const launcher = page.locator('.chat-launcher');
    await expect(launcher).toBeVisible();

    // Click to open the chat panel
    await launcher.click();

    // Check that the chat panel is visible
    const chatPanel = page.locator('.chat-panel');
    await expect(chatPanel).toBeVisible();

    // Verify that contacts from the mock are rendered
    const contactButtons = page.locator('.chat-contact-button');
    // 1 general support + 2 mocked teachers = 3
    await expect(contactButtons).toHaveCount(3);

    const mrMath = page.locator('text=Mr. Math');
    await expect(mrMath).toBeVisible();

    // Verify compactness by checking CSS properties or simply that it renders without error
    const contactList = page.locator('.chat-contact-list');
    await expect(contactList).toHaveCSS('gap', '4px'); // 0.25rem = 4px in default 16px rem
    
    // Verify padding of contact buttons
    const firstButton = contactButtons.nth(1); // the first teacher
    await expect(firstButton).toHaveCSS('padding', '5.6px 7.2px'); // 0.35rem 0.45rem = ~5.6px 7.2px
  });
});
