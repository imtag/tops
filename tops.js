const fs = require('fs');
const request = require('request');
const proxyUrl = 'http://127.0.0.1:7890';

const r = request.defaults({
  proxy: proxyUrl
})

// 转为百分数
function toPercent(num) {
  const str = (num * 100).toString();
  return Number(str.substring(0, str.indexOf('.') + 3));
}

const symbols = JSON.parse(fs.readFileSync('./data/symbols.json'))

// 请求数据
const start = 21;
const end = 21;
function requestData(current) {
  const resArr = [];
  const time = `2022-4-${current}`;
  const startTime = Date.parse(`${time} 08:00:00`);
  function getData(index) {
    if (index >= symbols.length) {
      const newResArr = resArr.sort((a, b) => {
        return b.maxinc - a.maxinc;
      })
  
      // 写入文件
      fs.writeFile(`./data/${time}.json`, JSON.stringify(newResArr), err => {
        if (err) {
          console.error('Write symbolsArr.json fail: ', err);
        }
      })

      // 继续拉取
      if (current < end) {
        requestData(current + 1)
      }
      return;
    }
  
    const symbol = symbols[index].symbol;
    console.log('当前编号: ', index + 1);
  
    r.get({ 
      url: 'https://fapi.binance.com/fapi/v1/klines',
      qs: {
        symbol,
        interval: '1d',
        startTime,
        limit: 1
      }
    }, (err, res) => {
      if (err) {
        console.error(err.message);
      } else {
        if (res.statusCode === 200) {
          const body = JSON.parse(res.body);
          if (body.length) {
            const symbolInfo = body[0];
            const open = symbolInfo[1];
            const high = symbolInfo[2];
            const low = symbolInfo[3];
            const close = symbolInfo[4];
            const vol = symbolInfo[7];

            const maxinc = (high - open) / open;
            const range = (close - open) / open;
    
            resArr.push({
              symb: symbol,
              open,
              close,
              high,
              low,
              vol,
              maxinc: toPercent(maxinc),
              range: toPercent(range)
            });
          }

          setTimeout(function() {
            getData(index + 1);
          }, 50);
        } else {
          console.error(res.statusMessage);
        }
      }
    });
  }
  getData(0);
}
requestData(start)