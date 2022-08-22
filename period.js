const fs = require('fs');
const puppeteer = require('puppeteer');

// 周期 1m 5m 15m 30m 1h 4h 1d 
const interval = process.argv[2] || '1d';

// 交易对
const symbols = JSON.parse(fs.readFileSync('./spot/symbols.json'));

(async () => {
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    userDataDir: './user_data'
  });
  const page = await browser.newPage();
  
  // 设置周期
  await page.goto('https://www.binance.com/zh-CN/trade/BTC_USDT', {
    waitUntil: 'networkidle0'
  });
  await page.evaluate((interval) => {
    // 现货chart_spot 合约chart_futures
    const key = 'chart_spot'
    const config = JSON.parse(localStorage.getItem(key));
    config.state.interval = interval;
    localStorage.setItem(key, JSON.stringify(config));
  }, interval);

  // 循环截图
  async function handle(index) {
    // 截图
    const symbol = symbols[index].baseAsset;
    await page.goto(`https://www.binance.com/zh-CN/trade/${symbol}_USDT`);
    await page.waitForSelector('.css-1i6ydsq', { hidden: true });
    await page.screenshot({ path: `./spot/images/${interval}_${index + 1}_${symbol}.png` });

    // 继续或退出
    if (index > 0) {
      handle(index - 1);
    } else {
      await browser.close();
    }
  }
  // handle(symbols.length - 1);
  handle(76);
})();
