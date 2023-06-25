import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance, {getPreviousOrderState} from "../db.js";

const handleStopPrice = async (tx, chainId) => {
  const {blockNumber, gasFee, hash, status, timeStamp, walletAddress} = getDataFromTx(tx);
  // Function: updateStopPrice(uint256 orderIndex,uint256 stopProfitPrice,uint256 stopLossPrice)
  const positionIndex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  const takeProfitPrice = BigNumber.from('0x' + tx.input.slice(74, 138)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  const stopLossPrice = BigNumber.from('0x' + tx.input.slice(138, 202)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  
  const order = await getPreviousOrderState(positionIndex, chainId, timeStamp);
  if (!order) return;
  const {product, leverage, direction, margin, volume, currency} = order;
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
      orderType: "TPSL_EDIT",
      direction,
      margin,
      volume,
      stopLossPrice,
      takeProfitPrice,
      fees: 0,
      executionFees: 0,
      walletAddress,
      status
    })
        .onConflict(['hash', 'orderType', 'positionIndex'])
        .merge()
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export default handleStopPrice