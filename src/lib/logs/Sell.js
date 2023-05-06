// Topics 0 0xb69e24112cb4483e933dc3bda2d474e8d511e1d7058a983fe98a7d5d78fb9743
// Sell (uint256 orderIndex, uint256 amount, address owner, uint256 value)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import getDataFromLog from "../getDataFromLog.js";
import knexInstance, {getPreviousOrderState, getExecutePrice} from "../db.js";

const handleSellLog = async (log, chainId) => {
  const {blockNumber, timeStamp, hash, gasFee} = getDataFromLog(log);
  // Sell (uint256 orderIndex, uint256 amount, address owner, uint256 value)
  const positionIndex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const amount = BigNumber.from('0x' + log.data.slice(66, 130)).toNumber() / 10000;
  const value = BigNumber.from('0x' + log.data.slice(194, 258)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  const walletAddress = '0x' + log.data.slice(130, 194).slice(24);
  
  // 获取实际开仓时的价格，查询表中的 MARKET_ORDER_FEE or LIMIT_ORDER_FEE
  try {
    const order = await getPreviousOrderState(positionIndex, chainId, timeStamp);
    if (!order) {
      console.log('order is null')
      return
    }
    const {product, leverage, direction, stopLossPrice, takeProfitPrice, currency} = order;
    
    // 获取实际开单时的价格
    const open_orders = await knexInstance('f_future_trading')
      .where('positionIndex', positionIndex)
      .whereIn('orderType', ['MARKET_ORDER_FEE', 'LIMIT_ORDER_FEE'])
      .andWhere('status', true);
    
    if (open_orders.length === 0) {
      return
    }
    const basePrice = open_orders[0].orderPrice;
    if (!basePrice) {
      return
    }
    
    // 获取sell的执行价格，通过 execute 获取实际的卖出价格
    const orderPrice = await getExecutePrice(hash, chainId, product);
    if (!orderPrice) {
      return
    }
    
    const volume = Number(((orderPrice / basePrice) * amount * leverage).toFixed(4));
    const fees = Number((volume * 0.0005).toFixed(4));
    const margin = value;
    
    // 是是止盈还是止损
    // 如果看多，orderPrice >= basePrice 则是止盈，反之则是止损
    // 如果看空，orderPrice < basePrice 则是止盈，反之则是止损
    const isTakeProfit = direction ? orderPrice >= basePrice : orderPrice < basePrice;
    
    try {
      const orders = await knexInstance('f_future_trading')
        .where('positionIndex', positionIndex)
        .andWhere('orderType', 'MARKET_CLOSE_REQUEST')
        .andWhere('status', true);
      // 判断是否是通过止盈止损来关单的，如果是则需要额外扣除15执行费
      if (orders.length > 0) {
        // 用户市价卖出
        try {
          await knexInstance('f_future_trading').insert({
            blockNumber,
            hash,
            timeStamp: new Date(timeStamp * 1000),
            gasFee,
            product,
            currency,
            chainId,
            positionIndex,
            leverage,
            orderPrice,
            orderType: 'MARKET_CLOSE',
            direction,
            margin,
            volume,
            stopLossPrice,
            takeProfitPrice,
            fees,
            executionFees: 0,
            walletAddress,
            status: true
          }).onConflict(['hash', 'orderType']).ignore()
          // console.log('save FutureTrading success')
        } catch (e) {
          console.log('--save FutureTrading error')
          console.log(e)
        }
      } else {
        // 用户限价卖出
        try {
          await knexInstance('f_future_trading').insert({
            blockNumber,
            hash,
            timeStamp: new Date(timeStamp * 1000),
            gasFee,
            product,
            currency,
            chainId,
            positionIndex,
            leverage,
            orderPrice,
            orderType: isTakeProfit ? 'TP_ORDER_FEE' : 'SL_ORDER_FEE',
            direction,
            margin,
            volume,
            stopLossPrice,
            takeProfitPrice,
            fees,
            executionFees: 0,
            walletAddress,
            status: true
          }).onConflict(['hash', 'orderType']).ignore()
          // console.log('save FutureTrading success')
        } catch (e) {
          console.log('--save FutureTrading error')
          console.log(e)
        }
        try {
          await knexInstance('f_future_trading').insert({
            blockNumber,
            hash,
            timeStamp: new Date(timeStamp * 1000),
            gasFee,
            product,
            currency,
            chainId,
            positionIndex,
            leverage,
            orderPrice,
            orderType: isTakeProfit ? 'TP_ORDER_EXECUTION' : 'SL_ORDER_EXECUTION',
            direction,
            margin,
            volume,
            stopLossPrice,
            takeProfitPrice,
            fees: 0,
            executionFees: 15,
            walletAddress,
            status: true
          }).onConflict(['hash', 'orderType']).ignore()
          // console.log('save FutureTrading success')
        } catch (e) {
          console.log('--save FutureTrading error')
          console.log(e)
        }
      }
    } catch (e) {
      console.log(e)
    }
  } catch (e) {
    console.log(e)
  }
}

export default handleSellLog