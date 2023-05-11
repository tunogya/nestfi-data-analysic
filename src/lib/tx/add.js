import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance, {getPreviousOrderState} from "../db.js";

const handleAdd = async (tx, chainId) => {
  const {blockNumber, gasFee, hash, status, timeStamp, walletAddress} = getDataFromTx(tx);
  // Function: add(uint256 orderIndex,uint256 amount)
  const positionIndex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  const amount = BigNumber.from('0x' + tx.input.slice(74, 138)).toNumber() / 10000;
  
  const order = await getPreviousOrderState(positionIndex, chainId, timeStamp);
  if (!order) return;
  const {product, leverage, direction, margin, volume, stopLossPrice, takeProfitPrice, currency} = order;
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
      orderPrice: null,
      orderType: "MARKET_ORDER_ADD",
      direction,
      margin: Number(margin) + Number(amount),
      volume,
      stopLossPrice,
      takeProfitPrice,
      fees: 0,
      executionFees: 0,
      walletAddress,
      status
    }).onConflict(['hash', 'orderType', 'positionIndex']).ignore()
    // console.log('save FutureTrading success')
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export default handleAdd