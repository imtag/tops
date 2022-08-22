const fs = require('fs');
const request = require('request');
const proxyUrl = 'http://127.0.0.1:7890';

const r = request.defaults({
  proxy: proxyUrl
})

// 请求交易对
r.get({ url: 'https://fapi.binance.com/fapi/v1/exchangeInfo' }, (err, res) => {
  if (err) {
    console.error(err.message);
  } else {
    if (res.statusCode === 200) {
      const symbols = JSON.parse(res.body).symbols;
      const symbolsStr = JSON.stringify(filterData(symbols));

      // 写入交易对文件
      fs.writeFile('./future/symbols.json', symbolsStr, err => {
        if (err) {
          console.error('Write symbols.json fail: ', err);
        }
      });
    } else {
      console.error(res.statusMessage);
    }
  }
});

/**
 * 洗数据
 * 
 * 过滤 contractType: CURRENT_QUARTER
 * 过滤 quoteAsset: BUSD
 */
function filterData(symbols) {
  const newSymbols = symbols.filter((item) => {
    return item.contractType !== 'CURRENT_QUARTER' && item.quoteAsset !== 'BUSD';
  });
  return newSymbols
}
