// Topics 0 0xf2bcfabb628d3e0f92291f1e0bc5f2322f8ac3af9e187670152968100e6b60a6
// Liquidate (uint256 orderIndex, address owner, uint256 reward)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import getDataFromLog from "../getDataFromLog.js";
import {saveFutureTrading, getExecutePrice, getPreviousOrderState} from "../db.js";

const handleLiquidateLog = async (log, chainid) => {
  const {blocknumber, timestamp, hash, gasfee} = getDataFromLog(log);
  
  // Liquidate (uint256 orderIndex, address owner, uint256 reward)
  const positionindex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const ordertype = 'MARKET_LIQUIDATION'
  // 从data中取出owner，且只保留40位
  const walletaddress = '0x' + log.data.slice(66, 130).slice(24);
  
  const order = await getPreviousOrderState(positionindex, chainid, timestamp);
  if (!order) return;
  
  const { product, leverage, margin, direction, stoplossprice, takeprofitprice, currency } = order;
  const orderprice = await getExecutePrice(hash, chainid, product);
  if (!orderprice) return;
  
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
    orderprice,
    ordertype,
    direction,
    margin,
    volume: 0,
    stoplossprice,
    takeprofitprice,
    fees: 0,
    executionfees: 0,
    walletaddress,
    status: true
  })
}

export default handleLiquidateLog