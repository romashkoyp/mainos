import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Campaign Loading functionality', () => {

  test('should load campaign from URL and display it in the list', async ({ page }) => {
    // Intercept the API call to corsproxy.io and return a mock response from local file
    await page.route('https://corsproxy.io/?*', async route => {
      const mockHtmlPath = path.join(process.cwd(), 'Archive', 'response.html');
      const mockHtmlContent = fs.readFileSync(mockHtmlPath, 'utf8');
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: mockHtmlContent
      });
    });

    // 1. Open the local index.html
    await page.goto(`file://${process.cwd()}/index.html`);

    // 2. Locate the input field and enter the provided URL
    const inputUrl = 'https://kengurumedia.odoo.com/fi/my/orders/3902/poles-map?access_token=0ca5dedc-8364-4fe2-ada6-4758b215684b';
    const campaignInput = page.locator('#campaign-id-input');
    await campaignInput.fill(inputUrl);

    // 3. Click the Load button
    const loadButton = page.locator('#load-campaign-btn');
    await loadButton.click();

    // 4. Verify that data is processed and appears in the campaign list
    // The #campaign-info container should become visible once a campaign is loaded
    const campaignInfo = page.locator('#campaign-info');
    await expect(campaignInfo).toBeVisible({ timeout: 10000 }); // give it some time to fetch and process data

    // Verify there is at least one campaign item present in the list
    const campaignItem = page.locator('.campaign-item');
    await expect(campaignItem).toBeVisible();

    // Verify progress tracking is triggered and visible
    const progressStatsContainer = page.locator('#progress-stats-container');
    await expect(progressStatsContainer).toBeVisible();

    // 5. Verify data is in IndexedDB (Database Check)
    // We open IndexedDB to query the stored data directly
    const recordsCount = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("MainosDB");
        request.onsuccess = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('markersCampaigns')) {
             resolve(0);
             return;
          }
          const transaction = db.transaction(['markersCampaigns'], 'readonly');
          const store = transaction.objectStore('markersCampaigns');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve(countRequest.result);
          };
        };
        request.onerror = () => reject('Failed to open DB');
      });
    });

    // Expect that records were saved into the DB
    expect(recordsCount).toBeGreaterThan(0);
  });
});
