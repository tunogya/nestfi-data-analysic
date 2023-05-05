// Topics 0 0xf7735c8cb2a65788ca663fc8415b7c6a66cd6847d58346d8334e8d52a599d3df
// Buy (uint256 orderIndex, uint256 amount, address owner)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import knexInstance, {getExecutePrice, getPreviousOrderState} from "../db.js";
import getDataFromLog from "../getDataFromLog.js";

// 需要判断是否是限价单，如果是限价单，则有执行费，如果是市价单，则没有执行费
const handleBuyLog = async (log, chainId) => {
  const {blockNumber, timeStamp, hash, gasFee} = getDataFromLog(log);
  
  // Buy (uint256 orderIndex, uint256 amount, address owner)
  const positionIndex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const amount = BigNumber.from('0x' + log.data.slice(66, 130)).toNumber() / 10000;
  
  // 最新的这个单可能是 LIMIT_REQUEST 或者 MARKET_REQUEST，也可能是 LIMIT_EDIT
  // order 的价格不代表最终执行价格，需要通过 f_future_price 来获取
  const order = await getPreviousOrderState(positionIndex, chainId, timeStamp);
  if (!order) return;
  const {product, leverage, margin, volume, direction, stopLossPrice, takeProfitPrice, walletAddress, currency} = order;
  
  const orderPrice = await getExecutePrice(hash, chainId, product);
  if (!orderPrice) return;
  const fees = Number(((amount * leverage) * 0.0005).toFixed(4));
  
  if (order.orderType === 'LIMIT_REQUEST' || order.orderType === 'LIMIT_EDIT') {
    // LIMIT_ORDER_EXECUTION
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
        orderType: 'LIMIT_ORDER_EXECUTION',
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
        orderType: 'LIMIT_ORDER_FEE',
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
        orderType: 'MARKET_ORDER_FEE',
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
  }
}

export default handleBuyLog