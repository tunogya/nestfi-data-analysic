import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance from "../db.js";

const handleNewBuyRequestWithUsdt = async (tx, chainId) => {
  const {blockNumber, gasFee, hash, status, timeStamp, walletAddress} = getDataFromTx(tx);
  const positionIndex = null;
  // Function: newBuyRequestWithUsdt(
  // uint256 usdtAmount,       // 10-74
  // uint256 minNestAmount,    // 74-138
  // uint256 channelIndex,     // 138-202
  // uint256 lever,            // 202-266
  // bool orientation,         // 266-330
  // uint256 basePrice,        // 330-394
  // bool limit,               // 394-458
  // uint256 stopProfitPrice,  // 458-522
  // uint256 stopLossPrice     // 522-586
  // )
  const channelIndex = BigNumber.from('0x' + tx.input.slice(138, 202)).toNumber();
  let product;
  if (channelIndex === 0) {
    product = 'ETH/USDT'
  } else if (channelIndex === 1) {
    product = 'BTC/USDT'
  } else if (channelIndex === 2) {
    product = 'BNB/USDT'
  }
  const leverage = BigNumber.from('0x' + tx.input.slice(202, 266)).toNumber();
  const direction = BigNumber.from('0x' + tx.input.slice(266, 330)).eq(1);
  const orderPrice = BigNumber.from('0x' + tx.input.slice(330, 394)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  
  const limit = BigNumber.from('0x' + tx.input.slice(394, 458)).eq(1);
  const stopLossPrice = BigNumber.from('0x' + tx.input.slice(458, 522)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  const takeProfitPrice = BigNumber.from('0x' + tx.input.slice(522, 586)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  
  // 判断该记录是否已经存在
  const exist = await knexInstance('f_future_trading')
      .where({
        hash,
        chainId,
        walletAddress,
      })
      .first();
  
  if (exist) {
    console.log('exist request order', hash)
    return;
  }
  
  try {
    await knexInstance('f_future_trading').insert({
      blockNumber,
      hash,
      timeStamp: new Date(timeStamp * 1000),
      gasFee,
      product,
      chainId,
      positionIndex,
      leverage,
      orderPrice,
      currency: 'USDT',
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
    }).onConflict(['hash', 'orderType', 'positionIndex']).ignore()
    // console.log('save FutureTrading success')
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export default handleNewBuyRequestWithUsdt;