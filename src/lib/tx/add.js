import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import {saveFutureTrading, getPreviousOrderState} from "../db.js";

const handleAdd = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  // Function: add(uint256 orderIndex,uint256 amount)
  const positionindex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  const amount = BigNumber.from('0x' + tx.input.slice(74, 138)).toNumber() / 10000;
  
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
    ordertype: "MARKET_ORDER_ADD",
    direction,
    margin: Number(margin) + Number(amount),
    volume,
    stoplossprice,
    takeprofitprice,
    fees: 0,
    executionfees: 0,
    walletaddress,
    status
  })
}

export default handleAdd