import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance, {getPreviousOrderState} from "../db.js";

const handleCancelBuyRequest = async (tx, chainId) => {
  const {blockNumber, gasFee, hash, status, timeStamp, walletAddress} = getDataFromTx(tx);
  
  // Function: cancelBuyRequest(uint256 orderIndex)
  const positionIndex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  
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
      orderType: "LIMIT_CANCEL",
      direction,
      margin,
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
export default handleCancelBuyRequest