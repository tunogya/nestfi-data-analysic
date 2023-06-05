import knexInstance from "./lib/db.js";

// 删除 f_future_trading 表中的数据, 通过 chainId = 534353

(async () => {
  await knexInstance('f_future_trading')
      .where('chainId', 534353)
      .del()
  
  await knexInstance('f_future_price')
      .where('chainId', 534353)
      .del()
  
  console.log('删除成功')
})();