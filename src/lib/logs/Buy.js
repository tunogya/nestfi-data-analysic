// Topics 0 0xf7735c8cb2a65788ca663fc8415b7c6a66cd6847d58346d8334e8d52a599d3df
// Buy (uint256 orderIndex, uint256 amount, address owner)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import {saveFutureTrading, getExecutePrice, getPreviousOrderState} from "../db.js";
import getDataFromLog from "../getDataFromLog.js";

// 需要判断是否是限价单，如果是限价单，则有执行费，如果是市价单，则没有执行费
const handleBuyLog = async (log, chainid) => {
  const {blocknumber, timestamp, hash, gasfee} = getDataFromLog(log);
  
  // Buy (uint256 orderIndex, uint256 amount, address owner)
  const positionindex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const amount = BigNumber.from('0x' + log.data.slice(66, 130)).toNumber() / 10000;
  
  // 最新的这个单可能是 LIMIT_REQUEST 或者 MARKET_REQUEST，也可能是 LIMIT_EDIT
  // order 的价格不代表最终执行价格，需要通过 f_future_price 来获取
  const order = await getPreviousOrderState(positionindex, chainid, timestamp);
  if (!order) return;
  const {product, leverage, margin, volume, direction, stoplossprice, takeprofitprice, walletaddress, currency} = order;
  
  const orderprice = await getExecutePrice(hash, chainid, product);
  if (!orderprice) return;
  const fees = Number(((amount * leverage) * 0.0005).toFixed(4));
  
  if (order.ordertype === 'LIMIT_REQUEST' || order.ordertype === 'LIMIT_EDIT') {
    // LIMIT_ORDER_EXECUTION
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
      ordertype: 'LIMIT_ORDER_EXECUTION',
      direction,
      margin,
      volume,
      stoplossprice,
      takeprofitprice,
      fees: 0,
      executionfees: 15,
      walletaddress,
      status: true
    })
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
      ordertype: 'LIMIT_ORDER_FEE',
      direction,
      margin,
      volume,
      stoplossprice,
      takeprofitprice,
      fees,
      executionfees: 0,
      walletaddress,
      status: true
    })
  } else {
    // MARKET_ORDER_FEE
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
      ordertype: 'MARKET_ORDER_FEE',
      direction,
      margin,
      volume,
      stoplossprice,
      takeprofitprice,
      fees,
      executionfees: 0,
      walletaddress,
      status: true
    })
  }
}

export default handleBuyLog