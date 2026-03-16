import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const routes = [
  '/master',
  '/workflow',
  '/saluran',
  '/banjir',
  '/neraca',
  '/embung',
  '/frekuensi',
  '/history',
  '/exec',
  '/ai'
];

test.describe('App Inspection', () => {
  const inspectionResults: any[] = [];

  test.afterAll(async () => {
    const reportPath = path.join(process.cwd(), 'inspection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(inspectionResults, null, 2));
    console.log(`Inspection report generated at ${reportPath}`);
  });

  for (const route of routes) {
    test(`Inspect page: ${route}`, async ({ page }) => {
      console.log(`Inspecting ${route}...`);
      await page.goto(route);
      
      // Wait for lazy-loaded content
      await page.waitForLoadState('networkidle');
      
      // Basic accessibility check (Level AA)
      const title = await page.title();
      const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
      
      // Component extraction
      // Look for data-testid, class names, or common UI elements
      const components = await page.evaluate(() => {
        const getComponents = (selector: string) => 
          Array.from(document.querySelectorAll(selector)).map(el => ({
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.trim().substring(0, 50),
            id: el.id,
            testId: el.getAttribute('data-testid')
          }));
        
        return {
          buttons: getComponents('button'),
          inputs: getComponents('input, select, textarea'),
          tables: getComponents('table, [role="table"]'),
          cards: getComponents('.bg-white.rounded-sm, .border.border-slate-200'),
          govermentElements: getComponents('[class*="pupr"], [class*="gov"]')
        };
      });

      const result = {
        route,
        title,
        mainHeading: h1,
        componentSummary: {
          buttonCount: components.buttons.length,
          inputCount: components.inputs.length,
          tableCount: components.tables.length,
          cardCount: components.cards.length,
          govElementCount: components.govermentElements.length
        },
        rawComponents: components
      };

      inspectionResults.push(result);
      
      // Take screenshot for visual audit
      const screenshotName = route.replace(/\//g, '') || 'home';
      await page.screenshot({ path: `inspection-screenshots/${screenshotName}.png`, fullPage: true });
    });
  }
});
