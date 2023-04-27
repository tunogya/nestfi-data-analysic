import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import {saveFutureTrading, getPreviousOrderState} from "../db.js";

const handleStopPrice = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  // Function: updateStopPrice(uint256 orderIndex,uint256 stopProfitPrice,uint256 stoplossprice)
  const positionindex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  const takeprofitprice = BigNumber.from('0x' + tx.input.slice(74, 138)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  const stoplossprice = BigNumber.from('0x' + tx.input.slice(138, 202)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  
  const order = await getPreviousOrderState(positionindex, chainid, timestamp);
  if (!order) return;
  const {product, leverage, direction, margin, volume, currency} = order;
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
  })
}

export default handleStopPrice