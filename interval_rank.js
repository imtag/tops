const fs = require('fs');
const request = require('request');

// 代理
const proxyUrl = 'http://127.0.0.1:7890';
const r = request.defaults({ proxy: proxyUrl });

// 交易对
const symbols = JSON.parse(fs.readFileSync('./spot/symbols.json'))

// 转为百分数
function toPercent(num) {
  const str = (num * 100).toString();
  return Number(str.substring(0, str.indexOf('.') + 3));
}

// 开始和结束日期
let resArr = [];

function sortArr(a, b) {
  return a.maxinc - b.maxinc;
}

// 递归请求所有交易对k线数据
function getKline(symbolIndex) {
  if (symbolIndex < 0) {
    fs.writeFile('./spot/interval_rank.json', JSON.stringify(resArr.sort(sortArr)), err => {
      if (err) {
        console.error('Write fail: ', err);
      }
    });
    return;
  };

  // 请求数据
  const symbol = symbols[symbolIndex].symbol;
  r.get({ url: `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1w&startTime=1653868800000`}, (err, res) => {
    console.log(`${symbolIndex}. ${symbol}`);

    // 请求失败
    if (err) {
      console.error('请求失败：', err.message);
      return;
    }

    // 请求成功
    if (res.statusCode === 200) {
      const body = JSON.parse(res.body);
      // 有数据
      if (body.length) {
        const [, open, high, low, close] = body[0];
        const maxinc = (high - open) / open;
        resArr.push({
          symb: symbol,
          open,
          close,
          high,
          low,
          maxinc: toPercent(maxinc)
        });
      }

      // 请求下一个交易对k线
      getKline(symbolIndex - 1);
    } else {
      console.error('请求失败：', res.statusMessage);
    }
  });
}
getKline(symbols.length - 1);
