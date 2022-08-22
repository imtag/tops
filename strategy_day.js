const request = require('request');

const proxyUrl = 'http://127.0.0.1:7890';
const r = request.defaults({ proxy: proxyUrl });

// const symbols = JSON.parse(fs.readFileSync('./future/symbols.json'));

const qs = `symbol=OMUSDT&interval=1m&limit=1000`;
r.get({ url: `https://api.binance.com/api/v3/klines?${qs}`}, (err, res) => {
    // 请求失败
    if (err) {
      console.error('请求失败：', err.message);
      return;
    }

    // 请求成功
    if (res.statusCode === 200) {
      let arr = [];
      let balance = 1000;
      const body = JSON.parse(res.body);
      // 有数据
      for (let index = 0; index < body.length; index++) {
        const [openTime, open, high, low, close] = body[index];
        /**
         * 1. 收阳线
         * 2. 上影线2%以内
         * 3. 下影线6%以上
         */
        // if (close > open && (high - close) / close <= 0.002 && (open - low) / open >= 0.005) {
        if (close === high && (high - low) / low >= 0.005) {
          const d = new Date(openTime);
          const dstr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          arr.push(dstr);

          // 后一天波动
          const nextOpen = body[index + 1][1];
          const nextClose = body[index + 1][4];
          const nextLow = body[index + 1][3];

          const lowRate = (nextLow - nextOpen) / nextOpen
          let rate = (nextClose - nextOpen) / nextOpen;

          // if (lowRate <= -0.05) {
          //   rate = -0.05;
          // }

          balance = balance + balance * rate;
          console.log(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}: `, balance * rate);
        }
      }
      console.log('余额:', balance);
    } else {
      console.error('请求失败：', res.statusMessage);
    }
  });
