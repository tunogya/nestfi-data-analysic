import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance from "../db.js";

const handleExecute = async (tx, chainId) => {
  const {blockNumber, gasFee, hash, status, timeStamp, walletAddress} = getDataFromTx(tx);
  // execute(uint256[7] prices,uint256[] orderIndices)
  const ethprice = BigNumber.from('0x' + tx.input.slice(10, 74)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  const btcprice = BigNumber.from('0x' + tx.input.slice(74, 138)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  const bnbprice = BigNumber.from('0x' + tx.input.slice(138, 202)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  
  let maticprice = 0, adaprice = 0, dogeprice = 0, xrpprice = 0;
  if (blockNumber >= 28341342) {
    maticprice = BigNumber.from('0x' + tx.input.slice(202, 266)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
    adaprice = BigNumber.from('0x' + tx.input.slice(266, 330)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
    dogeprice = BigNumber.from('0x' + tx.input.slice(330, 394)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
    xrpprice = BigNumber.from('0x' + tx.input.slice(394, 458)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  }
  
  try {
    await knexInstance('f_future_price').insert({
      blockNumber,
      hash,
      timeStamp: new Date(timeStamp * 1000),
      gasFee,
      walletAddress,
      chainId,
      ethprice,
      btcprice,
      bnbprice,
      maticprice,
      adaprice,
      dogeprice,
      xrpprice,
      status,
    }).onConflict(['hash', 'chainId']).ignore()
  } catch (e) {
    console.log(`save Future Price error`)
    console.log(e)
  }
}
export default handleExecute