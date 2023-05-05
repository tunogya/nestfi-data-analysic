import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance, {getPreviousOrderState} from "../db.js";

const handleCancelBuyRequest = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  
  // Function: cancelBuyRequest(uint256 orderIndex)
  const positionindex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  
  const order = await getPreviousOrderState(positionindex, chainid, timestamp);
  if (!order) return;
  const {product, leverage, direction, margin, volume, stoplossprice, takeprofitprice, currency} = order;
  
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
      ordertype: "LIMIT_CANCEL",
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
export default handleCancelBuyRequest