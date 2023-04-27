import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import {saveFutureTrading} from "../db.js";

const handleNewBuyRequest = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  const positionindex = null; // 此时还不知道positionIndex，需要通过Logs BuyRequest event来获取，匹配 hash
  const channelIndex = BigNumber.from('0x' + tx.input.slice(10, 74)).toNumber();
  let product;
  if (channelIndex === 0) {
    product = 'ETH/USDT'
  } else if (channelIndex === 1) {
    product = 'BTC/USDT'
  } else if (channelIndex === 2) {
    product = 'BNB/USDT'
  }
  const leverage = BigNumber.from('0x' + tx.input.slice(74, 138)).toNumber();
  const direction = BigNumber.from('0x' + tx.input.slice(138, 202)).eq(1);
  const orderprice = BigNumber.from('0x' + tx.input.slice(266, 330)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  
  const limit = BigNumber.from('0x' + tx.input.slice(330, 394)).eq(1);
  const stoplossprice = BigNumber.from('0x' + tx.input.slice(458, 522)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  const takeprofitprice = BigNumber.from('0x' + tx.input.slice(394, 458)).div(BigNumber.from(10).pow(16)).toNumber() / 100;
  
  await saveFutureTrading({
    blocknumber,
    hash,
    timestamp,
    gasfee,
    product,
    chainid,
    positionindex,
    leverage,
    orderprice,
    currency: 'NEST',
    ordertype: limit ? "LIMIT_REQUEST" : "MARKET_REQUEST",
    direction,
    margin: null,
    volume: null,
    stoplossprice,
    takeprofitprice,
    fees: 0,
    executionfees: 0,
    walletaddress,
    status
  })
}

export default handleNewBuyRequest;