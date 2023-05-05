import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance, {getPreviousOrderState} from "../db.js";

const handleStopPrice = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  // Function: updateStopPrice(uint256 orderIndex,uint256 stopProfitPrice,uint256 stoplossprice)
  const positionindex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  const takeprofitprice = BigNumber.from('0x' + tx.input.slice(74, 138)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  const stoplossprice = BigNumber.from('0x' + tx.input.slice(138, 202)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  
  const order = await getPreviousOrderState(positionindex, chainid, timestamp);
  if (!order) return;
  const {product, leverage, direction, margin, volume, currency} = order;
  try {
    await knexInstance('f_future_trading').insert({
      blocknumber,
      hash,
      timestamp: new Date(timestamp * 1000),
      gasfee,
      product,
      currency,
      chainid,
      positionindex,
      leverage,
      orderprice: null,
      ordertype: "TPSL_EDIT",
      direction,
      margin,
      volume,
      stoplossprice,
      takeprofitprice,
      fees: 0,
      executionfees: 0,
      walletaddress,
      status
    }).onConflict(['hash', 'ordertype']).ignore()
    // console.log('save FutureTrading success')
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export default handleStopPrice