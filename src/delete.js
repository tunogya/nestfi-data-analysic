import knexInstance from "./lib/db.js";


(async () => {
  const result = await knexInstance('f_future_trading')
      .where('positionIndex', null)
      .whereIn('orderType', ['LIMIT_REQUEST', 'MARKET_REQUEST'])
  
  // 遍历查询相同的 hash，判断是否有重复
  for (let i = 0; i < result.length; i++) {
    const order = result[i]
    const exist = await knexInstance('f_future_trading')
        .where({
          hash: order.hash,
          orderType: order.orderType
        })
        .whereNotNull('positionIndex')
    if (exist.length > 0) {
      console.log('准备删除', order._id, order.hash)
      await knexInstance('f_future_trading')
          .where({
            _id: order._id,
            hash: order.hash,
          })
          .del()
      console.log('删除成功', order._id, order.hash)
    }
  }
  process.exit(0)
})();