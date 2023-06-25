import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance from "../db.js";

const handleNewBuyRequest = async (tx, chainId) => {
  const {blockNumber, gasFee, hash, status, timeStamp, walletAddress} = getDataFromTx(tx);
  const positionIndex = null; // 此时还不知道positionIndex，需要通过Logs BuyRequest event来获取，匹配 hash
  const channelIndex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  let product;
  if (channelIndex === 0) {
    product = 'ETH/USDT'
  } else if (channelIndex === 1) {
    product = 'BTC/USDT'
  } else if (channelIndex === 2) {
    product = 'BNB/USDT'
  } else if (channelIndex === 3) {
    product = 'MATIC/USDT'
  } else if (channelIndex === 4) {
    product = 'ADA/USDT'
  } else if (channelIndex === 5) {
    product = 'DOGE/USDT'
  } else if (channelIndex === 6) {
    product = 'XRP/USDT'
  }
  const leverage = BigNumber.from('0x' + tx.input.slice(74, 138)).toNumber();
  const direction = BigNumber.from('0x' + tx.input.slice(138, 202)).eq(1);
  const orderPrice = BigNumber.from('0x' + tx.input.slice(266, 330)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  
  const limit = BigNumber.from('0x' + tx.input.slice(330, 394)).eq(1);
  const stopLossPrice = BigNumber.from('0x' + tx.input.slice(458, 522)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  const takeProfitPrice = BigNumber.from('0x' + tx.input.slice(394, 458)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  
  // 判断该记录是否已经存在
  const exist = await knexInstance('f_future_trading')
      .where({
        hash,
        chainId,
        walletAddress,
      })
      .first();
  
  if (exist) {
    // update status
    if (exist.status !== status) {
      await knexInstance('f_future_trading')
          .where({
            hash,
            chainId,
            walletAddress,
          })
          .update({
            status
          })
      return;
    }
    return;
  }
  
  try {
    await knexInstance('f_future_trading')
        .insert({
          blockNumber,
          hash,
          timeStamp: new Date(timeStamp * 1000),
          gasFee,
          product,
          chainId,
          positionIndex,
          leverage,
          orderPrice,
          currency: 'NEST',
          orderType: limit ? "LIMIT_REQUEST" : "MARKET_REQUEST",
          direction,
          margin: null,
          volume: null,
          stopLossPrice,
          takeProfitPrice,
          fees: 0,
          executionFees: 0,
          walletAddress,
          status
        })
        .onConflict(['hash', 'orderType', 'positionIndex'])
        .merge()
    // console.log('save FutureTrading success')
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export default handleNewBuyRequest;