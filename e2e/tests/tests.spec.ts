import { test } from '@playwright/test';

test('Run two tabs for different websites', async ({ browser }) => {
  test.setTimeout(4_000_000);
  const context = await browser.newContext();

  // Tab 1: VnExpress
  const page1 = await context.newPage();
  await page1.goto('https://vnexpress.net');
  console.log('Tab 1: VnExpress loaded');

  // Tab 2: TuoiTre
  const page2 = await context.newPage();
  await page2.goto('https://tuoitre.vn');
  console.log('Tab 2: TuoiTre loaded');

  // Bạn có thể thao tác riêng biệt với từng tab:
  const title1 = await page1.title();
  const title2 = await page2.title();

  console.log('Title VnExpress:', title1);
  console.log('Title TuoiTre:', title2);

  // await context.close();
});
