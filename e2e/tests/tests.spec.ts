import { test, expect } from '@playwright/test';
import fs from 'fs';

interface Article {
  url: string;
  title: string;
  content: string;
  category: string;
}

test('Scrape all categories on VNExpress', async ({ page }) => {
  test.setTimeout(800_000);
  await page.goto('https://vnexpress.net');
  await page.waitForTimeout(3000);

  // 1. Thu thập các đường dẫn chuyên mục chính
  // const categoryLinks = await page.$$eval(
  //   'nav.main-nav li a',
  //   (links) =>
  //     links
  //       .map((a) => ({
  //         name: a.textContent?.trim() || '',
  //         href: (a as HTMLAnchorElement).href,
  //       }))
  //       .filter((item) => item.name && item.href)
  // );
  const categoryLinks = await page.$$eval(
  'nav.main-nav li a',
  (links) =>
    links
      .map((link) => ({
        name: link.textContent?.trim() || '',
        href: (link as HTMLAnchorElement).href,
      }))
      .slice(2) // Bỏ 2 mục đầu: Trang chủ & Mới nhất
      .filter(
        (item) =>
          item.name &&
          !['Video', 'Podcasts', 'Thư giãn', 'Tất cả', ].includes(item.name)
      )
  );
  const allArticles: Article[] = [];

  for (const category of categoryLinks) {
    console.log(`Đang xử lý chuyên mục: ${category.name}`);
    try {
      await page.goto(category.href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const articleUrls = await page.$$eval('h3.title-news a', (links) =>
        links.map((link) => (link as HTMLAnchorElement).href)
      );

      for (let i = 0; i < Math.min(5, articleUrls.length); i++) {
        const url = articleUrls[i];
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const titleLocator = page.locator('h1.title-detail');
        const title =
          (await titleLocator.count()) > 0
            ? (await titleLocator.textContent())?.trim()
            : 'Không có tiêu đề';

        const content = await page.$$eval('article.fck_detail p', (ps) =>
          ps
          .map((p) => p.textContent?.trim())
          .filter((text) => text && text.length > 0)
          .join('\n')
        );

        allArticles.push({
          url,
          title,
          content,
          category: category.name,
        });

        console.log(`Bài viết: ${title}`);
      }
    } catch (err) {
      console.warn(`Lỗi khi xử lý chuyên mục ${category.name}: ${err}`);
    }
  }

  // 5. Lưu ra file JSON
  const output = 'articles.json';
  fs.writeFileSync(output, JSON.stringify(allArticles, null, 2), 'utf-8');
  console.log(`Đã lưu ${allArticles.length} bài viết vào ${output}`);
  expect(allArticles.length).toBeGreaterThan(0);
});
