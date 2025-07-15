import { test, expect } from '@playwright/test';
import fs from 'fs';

interface Article {
  url: string;
  title: string;
  sapo: string;
  content: string;
  category: string;
}

test('Scrape Tuoi Tre news articles from selected categories', async ({ browser }) => {
  test.setTimeout(4_000_000);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://tuoitre.vn', { waitUntil: 'domcontentloaded', timeout: 5 * 60 * 1000 });

  // Lấy danh sách các liên kết chuyên mục, bỏ qua Trang chủ và Tin mới nhất
  const categoryLinks = await page.$$eval(
    'div.header__nav-flex ul.menu-nav li a.nav-link',
    (links) => links.slice(2).map((a) => ({
      name: a.textContent?.trim() || 'Không rõ chuyên mục',
      href: (a as HTMLAnchorElement).href,
    }))
  );

  const articles: Article[] = [];

  for (const category of categoryLinks.slice(0, 3)) {
    console.log(`\n--- Đang thu thập từ chuyên mục: ${category.name} ---`);

    for (let pageNum = 1; pageNum <= 4; pageNum++) {
      const pagedUrl = pageNum === 1 ? category.href : `${category.href}?page=${pageNum}`;
      try {
        await page.goto(pagedUrl, { waitUntil: 'domcontentloaded', timeout: 5 * 60 * 1000 });
        await page.waitForTimeout(1000);

        const articleLinks = await page.$$eval('h3.box-title-text a', links =>
          links.map(a => (a as HTMLAnchorElement).href)
        );

        for (const url of articleLinks) {
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5 * 60 * 1000 });
            await page.waitForTimeout(1000);

            const titleLocator = page.locator('h1.detail-title.article-title');
            const sapoLocator = page.locator('h2.detail-sapo');
            const title = (await titleLocator.count()) > 0
              ? (await titleLocator.textContent())?.trim()
              : 'Không có tiêu đề';

            const sapo = (await sapoLocator.count()) > 0
              ? (await sapoLocator.textContent())?.trim()
              : '';

            const content = await page.$$eval('div.detail-content.afcbc-body p', ps =>
              ps.map(p => p.textContent?.trim()).filter(Boolean).join('\n')
            );

            let categoryName = category.name;
            try {
              const categoryLocator = page.locator('.bread-crumb li a');
              if (await categoryLocator.count() > 1) {
                const text = await categoryLocator.nth(1).textContent();
                if (text) categoryName = text.trim();
              }
            } catch (e) {
              console.warn(`Không lấy được chuyên mục chi tiết cho bài: ${url}`);
            }

            articles.push({ url, title: title || 'Không có tiêu đề', sapo, content, category: categoryName });
            console.log(`\u2714 Đã thu thập: ${title}`);

          } catch (err) {
            console.warn(`\u26A0\uFE0F Bỏ qua bài: ${url} vì lỗi`);
          }
        }

        await page.waitForTimeout(2000);
      } catch (e) {
        console.error(`\u274C Lỗi khi duyệt ${pagedUrl}, dừng vòng lặp.`);
        break;
      }
    }
  }

  // Ghi vào file JSON
  fs.writeFileSync('tuoitre_articles.json', JSON.stringify(articles, null, 2), 'utf-8');
  console.log(`\n\u2714 Đã lưu ${articles.length} bài viết vào 'tuoitre_articles.json'`);
});
