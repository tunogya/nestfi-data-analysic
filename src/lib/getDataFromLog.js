import {BigNumber} from "@ethersproject/bignumber";

const getDataFromLog = (log) => {
  const blockNumber = BigNumber.from(log.blockNumber).toNumber();
  const gasFee = BigNumber.from(log.gasUsed).mul(BigNumber.from(log.gasPrice)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  const timeStamp = BigNumber.from(log.timeStamp).toNumber();
  const hash = log.transactionHash;
  
  return {
    blockNumber,
    gasFee,
    timeStamp,
    hash
  }
}

export default getDataFromLog