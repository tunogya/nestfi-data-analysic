import {BigNumber} from "@ethersproject/bignumber";

const getDataFromTx = (tx) => {
  const blocknumber = Number(tx.blockNumber);
  const hash = tx.hash;
  const timestamp = Number(tx.timeStamp);
  const gasfee = BigNumber.from(tx.gasUsed).mul(BigNumber.from(tx.gasPrice)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  const status = tx.isError === '0';
  const walletaddress = tx.from;
  
  return {
    blocknumber,
    hash,
    timestamp,
    gasfee,
    status,
    walletaddress
  }
}

export default getDataFromTx