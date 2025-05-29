// tests/stock-table.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Thu thập bảng giá cổ phiếu từ Simplize.vn', async ({ page }) => {
    test.setTimeout(2_000_000);
    const baseUrl = 'https://simplize.vn/co-phieu';
    const allData: any[] = [];

    const columnNames = [
        'MaCoPhieu',
        'VonHoa',
        'GiaHienTai',
        'BienDongGia',
        'TuDauNam',
        'PE',
        'PB',
        'ROE',
        'TTLNST3Nam',
        'TySuatCoTuc',
        'San',
        'Nganh',
    ];

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

    for (let pageIndex = 0; pageIndex < 30; pageIndex++) {
        console.log(`🔄 Đang thu thập trang ${pageIndex + 1}...`);

        // Chờ bảng render
        await page.waitForSelector('.simplize-table', { timeout: 60000 });
        await page.waitForTimeout(1000); // nghỉ ngắn

        const rows = await page.$$('.simplize-table .simplize-table-row');

        for (const row of rows) {
        const cells = await row.$$('td');
        const rowData: { [key: string]: string } = {};

        for (let i = 0; i < columnNames.length && i < cells.length; i++) {
            const text = (await cells[i].innerText()).trim();
            rowData[columnNames[i]] = text;
        }

        allData.push(rowData);
        }

        // Chuyển trang nếu còn trang tiếp
        const nextButton = page.locator('li.simplize-pagination-next:not(.simplize-pagination-disabled)');

        if (await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForTimeout(1500); // nghỉ ngắn
        } else {
        console.log('✅ Không còn trang tiếp theo.');
        break;
        }
    }

    // Lưu vào file JSON
    fs.writeFileSync('co_phieu_data.json', JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`✅ Đã lưu ${allData.length} dòng dữ liệu vào co_phieu_data.json`);
});
