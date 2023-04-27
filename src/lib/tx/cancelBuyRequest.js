import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import {saveFutureTrading, getPreviousOrderState} from "../db.js";

const handleCancelBuyRequest = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  
  // Function: cancelBuyRequest(uint256 orderIndex)
  const positionindex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  
  const order = await getPreviousOrderState(positionindex, chainid, timestamp);
  if (!order) return;
  const {product, leverage, direction, margin, volume, stoplossprice, takeprofitprice, currency} = order;
  
  await saveFutureTrading({
    blocknumber,
    hash,
    timestamp,
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
  })
}
export default handleCancelBuyRequest