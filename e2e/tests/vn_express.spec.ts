import { test, expect } from '@playwright/test';
import fs from 'fs';

interface Article {
  url: string;
  title: string;
  content: string;
  category: string;
}

test('Crawl VNExpress', async ({ page }) => {
    test.setTimeout(4_000_000);
    const homepage = 'https://vnexpress.net';
    const maxPagesPerCategory = 10;
    const articles: Article[] = [];

    await page.goto(homepage, { waitUntil: 'domcontentloaded' });

    const categoryLinks = await page.$$eval(
        'nav.main-nav li a',
        (links) =>
        links.map((link) => ({
            href: (link as HTMLAnchorElement).href,
            text: link.textContent?.trim() || ''
        }))
    );
    await page.waitForTimeout(1500);

    const filteredCategories = categoryLinks.slice(2).filter(
        (item) =>
            item.text &&
            !['Video', 'Podcasts', 'Thư giãn', 'Tất cả', ].includes(item.text)
    ); // bỏ Trang chủ và Mới nhất

    for (const { href: categoryUrl, text: categoryName } of filteredCategories) {
        console.log(`\n📂 Đang xử lý chuyên mục: ${categoryName} (${categoryUrl})`);
        const collectedUrls = new Set<string>();
        try{
            await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' });
        } catch(error) {
            break
        }

        for (let i = 0; i < maxPagesPerCategory; i++) {
        console.log(`🔄 Trang ${i + 1}`);

        const urlsOnPage = await page.$$eval('h3.title-news a', links =>
            links.map(link => (link as HTMLAnchorElement).href)
        );

        urlsOnPage.forEach(url => collectedUrls.add(url));
        await page.waitForTimeout(3000); // nghỉ 3s giữa các trang

        const nextButton = page.locator('a.btn-page.next-page');
        if (await nextButton.isVisible()) {
            await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            nextButton.click()
            ]);
        } else {
            console.warn('⛔ Không còn nút Trang sau.');
            break;
        }
        }

        console.log(`📄 Thu được ${collectedUrls.size} bài trong chuyên mục "${categoryName}"`);

        for (const url of collectedUrls) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const titleLocator = page.locator('h1.title-detail');
            const title =
            (await titleLocator.count()) > 0
                ? (await titleLocator.textContent())?.trim()
                : 'Không có tiêu đề';

            const content = await page.$$eval('article.fck_detail p', ps =>
            ps.map(p => p.textContent?.trim()).join('\n')
            );

            articles.push({
            url,
            title,
            content: content || '',
            category: categoryName
            });

            console.log(`✅ ${title.slice(0, 60)}...`);
            await page.waitForTimeout(1000); // nghỉ 1s giữa các bài
        } catch (err) {
            console.warn(`⚠️ Lỗi khi xử lý ${url}: ${err}`);
        }
        }
    }

    console.log(`\n🎉 Thu thập xong ${articles.length} bài viết.`);

    // 🔽 Ghi dữ liệu ra file JSON
    const outputPath = 'vnexpress_data.json';
    fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2), 'utf-8');
    console.log(`Đã lưu ${articles.length} bài viết vào ${outputPath}`);
    expect(articles.length).toBeGreaterThan(0);
});
