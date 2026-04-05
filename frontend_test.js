const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Create a listener to catch all console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Create a listener to catch all network requests that fail
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });

  // Create a listener for all responses to see status codes
  page.on('response', response => {
    console.log(`RESPONSE: ${response.url()} - ${response.status()}`);
  });

  console.log("Navigating to http://localhost:5173/login");
  await page.goto('http://localhost:5173/login');

  console.log("Waiting for network idle...");
  await page.waitForLoadState('networkidle');

  console.log("Clicking Sign In...");
  // We're just testing the default email/password setup
  await page.click('button[type="button"]:has-text("Patient")');
  await page.click('button[type="submit"]');

  console.log("Waiting a bit for response...");
  await page.waitForTimeout(2000);

  console.log("Checking if error is displayed...");
  const errorText = await page.evaluate(() => {
    const errorEl = document.querySelector('.bg-rose-50');
    return errorEl ? errorEl.textContent : 'No error element found';
  });
  console.log(`Error on page: ${errorText}`);

  await browser.close();
})();
