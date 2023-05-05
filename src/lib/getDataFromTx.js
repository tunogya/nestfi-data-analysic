import {BigNumber} from "@ethersproject/bignumber";

const getDataFromTx = (tx) => {
  const blockNumber = Number(tx.blockNumber);
  const hash = tx.hash;
  const timeStamp = Number(tx.timeStamp);
  const gasFee = BigNumber.from(tx.gasUsed).mul(BigNumber.from(tx.gasPrice)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  const status = tx.isError === '0';
  const walletAddress = tx.from;
  
  return {
    blockNumber,
    hash,
    timeStamp,
    gasFee,
    status,
    walletAddress
  }
}

export default getDataFromTx