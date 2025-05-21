import {test} from '@playwright/test';

test.skip('Basic Navigation', async ({ page }) => {
    await page.goto('https://about.gitlab.com/');
    await page.waitForTimeout(3000);
    await page.reload();
})

test('Interacting with Web Element on GitLab', async ({page}) => {
    await page.goto('https://about.gitlab.com/');
    await page.getByRole('link', {name: 'Get free trial'}).nth(0).click()
    await page.getByTestId('new-user-first-name-field').fill('Quynh')
    await page.getByTestId('new-user-last-name-field').fill('Nhu')
})

test.skip('Using Various Locator Methods', async ({page}) => {
    await page.goto('https://about.gitlab.com/');
    await page.getByRole('link', {name: 'Sign in'}).click();
})