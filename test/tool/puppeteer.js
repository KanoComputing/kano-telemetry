const puppeteer = require('puppeteer');
const { serve } = require('./server/index');

async function run({ root = 'test', headless = true, slowMo = 100, timeout = 10000 } = {}) {
    const server = serve({ port: 0 });
    const { port } = server.address();

    (async () => {
        const browser = await puppeteer.launch({ headless, slowMo, timeout });
        const page = await browser.newPage();
        await page.exposeFunction('onMochaEvent', (line) => {
            console.log(line);
        });
        await page.exposeFunction('onMochaEnd', () => {
            browser.close();
            server.close();
        });
        await page.goto(`http://localhost:${port}${root}`);
    })();
}

module.exports = {
    run,
};
