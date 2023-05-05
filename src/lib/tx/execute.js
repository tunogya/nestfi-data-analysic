import {BigNumber} from "@ethersproject/bignumber";
import getDataFromTx from "../getDataFromTx.js";
import knexInstance from "../db.js";

const handleExecute = async (tx, chainid) => {
  const {blocknumber, gasfee, hash, status, timestamp, walletaddress} = getDataFromTx(tx);
  // Function: execute(uint256[3] prices,uint256[] orderIndices)
  const ethprice = BigNumber.from('0x' + tx.input.slice(10, 74)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  const btcprice = BigNumber.from('0x' + tx.input.slice(74, 138)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  const bnbprice = BigNumber.from('0x' + tx.input.slice(138, 202)).div(BigNumber.from(10).pow(14)).toNumber() / 10000;
  
  try {
    await knexInstance('f_future_price').insert({
      blocknumber,
      hash,
      timestamp: new Date(timestamp * 1000),
      gasfee,
      walletaddress,
      chainid,
      ethprice,
      btcprice,
      bnbprice,
      status,
    }).onConflict(['hash', 'chainid']).ignore()
  } catch (e) {
    console.log(`save Future Price error`)
    console.log(e)
  }
}
export default handleExecute