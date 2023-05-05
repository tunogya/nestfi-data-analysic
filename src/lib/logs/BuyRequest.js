// Topics 0 0xbf4cbb4fa8c0e1d1155a78077bea3d41807ceece161cfae79165e71b82bbeee1
// BuyRequest (uint256 index, uint256 amount, address owner)
// address 0x02904e03937e6a36d475025212859f1956bec3f0
import {BigNumber} from "@ethersproject/bignumber";
import getDataFromLog from "../getDataFromLog.js";
import knexInstance from "../db.js";

const handleBuyRequestLog = async (log, chainId) => {
  const {hash} = getDataFromLog(log);
  // Buy (uint256 orderIndex, uint256 amount, address owner)
  // 获取positionIndex，通过hash来匹配更新之前的 BuyRequest 记录
  const positionIndex = BigNumber.from(log.data.slice(0, 66)).toNumber();
  const amount = BigNumber.from('0x' + log.data.slice(66, 130)).toNumber() / 10000;
  
  try {
    const orders = await knexInstance('f_future_trading')
        .where({
          hash,
          chainId,
        })
    if (orders.length === 0) {
      console.log('BuyRequest not found')
      process.exit(1)
    }
    const order = orders[0];
    const {leverage} = order;
    
    await knexInstance('f_future_trading')
        .where({
          hash,
          chainId,
        })
        .update({
          positionIndex,
          margin: amount,
          volume: amount * leverage,
        })
    // console.log('update BuyRequest success')
  } catch (e) {
    console.log(e)
  }
}

export default handleBuyRequestLog