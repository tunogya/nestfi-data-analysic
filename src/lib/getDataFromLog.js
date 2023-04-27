import {BigNumber} from "@ethersproject/bignumber";

const getDataFromLog = (log) => {
  const blocknumber = BigNumber.from(log.blockNumber).toNumber();
  const gasfee = BigNumber.from(log.gasUsed).mul(BigNumber.from(log.gasPrice)).div(BigNumber.from(10).pow(12)).toNumber() / 1000000;
  const timestamp = BigNumber.from(log.timeStamp).toNumber() * 1000;
  const hash = log.transactionHash;
  
  return {
    blocknumber,
    gasfee,
    timestamp,
    hash
  }
}

export default getDataFromLog