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
const ym = '2022-8';
const start = 28;
const end = 30;

let currentDate = start;
let resArr = [];

// 递归请求所有交易对k线数据
function getKline(symbolIndex) {
    // 结束一轮
    if (symbolIndex < 0) {
        // 按波动排序
        const newResArr = resArr.sort((a, b) => {
            return b.maxinc - a.maxinc;
        })

        // 写入文件
        fs.writeFile(`./spot/${ym}-${currentDate}.json`, JSON.stringify(newResArr), err => {
            if (err) {
                console.error('文件写入失败: ', err);
            }
        })

        // 继续拉取下一天
        currentDate += 1;
        resArr = [];
        if (currentDate < end) {
            getKline(symbols.length - 1);
        }
        return;
    }

    // 请求数据
    const symbol = symbols[symbolIndex].symbol;
    const startTime = Date.parse(`${ym}-${currentDate} 08:00:00`);
    const endTime = Date.parse(`${ym}-${currentDate + 1} 07:59:59`);
    const qs = `symbol=${symbol}&interval=1d&startTime=${startTime}&endTime=${endTime}`;
    r.get({ url: `https://api.binance.com/api/v3/klines?${qs}` }, (err, res) => {
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
                const [, open, high, low, close, , , vol] = body[0];
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

            // 请求下一个交易对k线
            getKline(symbolIndex - 1);
        } else {
            console.error('请求失败：', res.statusMessage);
        }
    });
}
getKline(symbols.length - 1);