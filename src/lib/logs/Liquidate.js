// Topics 0 0xf2bcfabb628d3e0f92291f1e0bc5f2322f8ac3af9e187670152968100e6b60a6
// Liquidate (uint256 orderIndex, address owner, uint256 reward)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import getDataFromLog from "../getDataFromLog.js";
import knexInstance, {getExecutePrice, getPreviousOrderState} from "../db.js";

const handleLiquidateLog = async (log, chainId) => {
  const {blockNumber, timeStamp, hash, gasFee} = getDataFromLog(log);
  
  // Liquidate (uint256 orderIndex, address owner, uint256 reward)
  const positionIndex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const orderType = 'MARKET_LIQUIDATION'
  // 从data中取出owner，且只保留40位
  const walletAddress = '0x' + log.data.slice(66, 130).slice(24);
  
  const order = await getPreviousOrderState(positionIndex, chainId, timeStamp);
  if (!order) return;
  
  const { product, leverage, margin, direction, stopLossPrice, takeProfitPrice, currency } = order;
  const orderPrice = await getExecutePrice(hash, chainId, product);
  if (!orderPrice) return;

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
      orderType,
      direction,
      margin,
      volume: 0,
      stopLossPrice,
      takeProfitPrice,
      fees: 0,
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

export default handleLiquidateLog