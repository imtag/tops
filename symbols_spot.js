const fs = require('fs');
const request = require('request');
const proxyUrl = 'http://127.0.0.1:7890';

const r = request.defaults({
    proxy: proxyUrl
})

// 请求交易对
r.get({ url: 'https://api.binance.com/api/v3/exchangeInfo' }, (err, res) => {
    if (err) {
        console.error(err.message);
    } else {
        if (res.statusCode === 200) {
            const symbols = JSON.parse(res.body).symbols;
            const symbolsStr = JSON.stringify(filterData(symbols));

            // 写入交易对文件
            fs.writeFile('./spot/symbols.json', symbolsStr, err => {
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
 */
function filterData(symbols) {
    const newSymbols = symbols
        .filter(item => {
            return item.status === 'TRADING' && ['USDT', 'BUSD'].includes(item.quoteAsset) && item.symbol.indexOf('DOWNUSDT') === -1 && item.symbol.indexOf('UPUSDT') === -1;
        })
        .map(item => {
            const { baseAsset, symbol, quoteAsset } = item
            return {
                baseAsset,
                symbol,
                quoteAsset
            };
        });

    // 有usdt过滤掉busd
    return newSymbols.filter(item => {
        if (item.quoteAsset === 'BUSD') {
            return !newSymbols.find(i => item.baseAsset === i.baseAsset && i.quoteAsset === 'USDT');
        }
        return item;
    });
}