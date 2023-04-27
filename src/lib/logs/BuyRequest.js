// Topics 0 0xbf4cbb4fa8c0e1d1155a78077bea3d41807ceece161cfae79165e71b82bbeee1
// BuyRequest (uint256 index, uint256 amount, address owner)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import sql, {getPreviousOrderState} from "../db.js";
import getDataFromLog from "../getDataFromLog.js";

const handleBuyRequestLog = async (log, chainid) => {
  const {hash} = getDataFromLog(log);
  // Buy (uint256 orderIndex, uint256 amount, address owner)
  // 获取positionIndex，通过hash来匹配更新之前的 BuyRequest 记录
  const positionindex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const amount = BigNumber.from('0x' + log.data.slice(66, 130)).toNumber() / 10000;
  
  try {
    const orders = await sql`
        SELECT *
        FROM f_future_trading
        WHERE hash = ${hash}
          AND chainid = ${chainid}
    `
    if (orders.length === 0) {
      console.log('BuyRequest not found')
      process.exit(1)
    }
    const order = orders[0];
    const {leverage} = order;
    
    await sql`
        UPDATE f_future_trading
        SET positionindex = ${positionindex},
            margin        = ${amount},
            volume        = ${amount * leverage}
        WHERE hash = ${hash}
          AND chainid = ${chainid}
    `
    // console.log('update BuyRequest success')
  } catch (e) {
    console.log(e)
  }
}

export default handleBuyRequestLog