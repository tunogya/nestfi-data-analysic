// Topics 0 0xb69e24112cb4483e933dc3bda2d474e8d511e1d7058a983fe98a7d5d78fb9743
// Sell (uint256 orderIndex, uint256 amount, address owner, uint256 value)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import sql from "../db.js";
import getDataFromLog from "../getDataFromLog.js";
import {saveFutureTrading, getPreviousOrderState, getExecutePrice} from "../db.js";

const handleSellLog = async (log, chainid) => {
  const {blocknumber, timestamp, hash, gasfee} = getDataFromLog(log);
  // Sell (uint256 orderIndex, uint256 amount, address owner, uint256 value)
  const positionindex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const amount = BigNumber.from('0x' + log.data.slice(66, 130)).toNumber() / 10000;
  const value = BigNumber.from('0x' + log.data.slice(194, 258)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  const walletaddress = '0x' + log.data.slice(130, 194).slice(26);
  
  // 获取实际开仓时的价格，查询表中的 MARKET_ORDER_FEE or LIMIT_ORDER_FEE
  try {
    const order = await getPreviousOrderState(positionindex, chainid, timestamp);
    if (!order) return;
    const {product, leverage, direction, stoplossprice, takeprofitprice, currency} = order;
    
    // 获取实际开单时的价格
    const open_orders = await sql`
        SELECT *
        FROM f_future_trading
        WHERE positionindex = ${positionindex}
          AND (ordertype = 'MARKET_ORDER_FEE'
            OR ordertype = 'LIMIT_ORDER_FEE')
          AND status = true;
    `
    if (open_orders.length === 0) return;
    const baseprice = open_orders[0].orderprice
    
    // 获取sell的执行价格，通过 execute 获取实际的卖出价格
    const orderprice = await getExecutePrice(hash, chainid, product);
    if (!orderprice) return;
    
    const volume = Number(((orderprice / baseprice) * amount * leverage).toFixed(4));
    const fees = Number((volume * 0.0005).toFixed(4));
    const margin = value;
    
    // 是是止盈还是止损
    // 如果看多，orderprice >= baseprice 则是止盈，反之则是止损
    // 如果看空，orderprice < baseprice 则是止盈，反之则是止损
    const isTakeProfit = direction ? orderprice >= baseprice : orderprice < baseprice;
    
    try {
      const orders = await sql`
          SELECT *
          FROM f_future_trading
          WHERE positionindex = ${positionindex}
            AND ordertype = 'MARKET_CLOSE_REQUEST'
            AND status = true;
      `
      // 判断是否是通过止盈止损来关单的，如果是则需要额外扣除15执行费
      if (orders.length > 0) {
        // 用户市价卖出
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
          ordertype: 'MARKET_CLOSE',
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
        // 用户限价卖出
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
          ordertype: isTakeProfit ? 'TP_ORDER_FEE' : 'SL_ORDER_FEE',
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
          ordertype: isTakeProfit ? 'TP_ORDER_EXECUTION' : 'SL_ORDER_EXECUTION',
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
      }
    } catch (e) {
      console.log(e)
    }
  } catch (e) {
    console.log(e)
  }
}

export default handleSellLog