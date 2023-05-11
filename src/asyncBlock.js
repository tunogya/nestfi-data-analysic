import fetch from 'node-fetch';
import {BigNumber} from "@ethersproject/bignumber";
import handleNewBuyRequest from "./lib/tx/newBuyRequest.js";
import handleCancelBuyRequest from "./lib/tx/cancelBuyRequest.js";
import handleAdd from "./lib/tx/add.js";
import handleSellRequest from "./lib/tx/newSellRequest.js";
import handleStopPrice from "./lib/tx/updateStopPrice.js";
import handleExecute from "./lib/tx/execute.js";
import handleBuyRequestLog from "./lib/logs/BuyRequest.js";
import handleBuyLog from "./lib/logs/Buy.js";
import handleLiquidateLog from "./lib/logs/Liquidate.js";
import handleSellLog from "./lib/logs/Sell.js";
import handleNewBuyRequestWithUsdt from "./lib/tx/newBuyRequestWithUsdt.js";
import dotenv from 'dotenv';
import knexInstance from "./lib/db.js";

dotenv.config();

class BlockchainData {
  constructor(CONTRACT_ADDRESS, API_KEY) {
    this.chainId = 56;
    this.startBlock = 0;
    this.endBlock = 0;
    this.contractAddress = CONTRACT_ADDRESS;
    this.apiKey = API_KEY;
  }
  
  async fetchStartBlock() {
    console.log('connect db and fetch startblock...')
    try {
      const res1 = await knexInstance('f_future_trading').select('blockNumber').orderBy('blockNumber', 'desc').limit(1);
      const res2 = await knexInstance('f_future_price').select('blockNumber').orderBy('blockNumber', 'desc').limit(1);
      if (res1.length === 0 || res2.length === 0) {
        this.startBlock = 0;
      } else {
        this.startBlock = Math.max(res1[0].blockNumber, res2[0].blockNumber) + 1;
      }
      console.log('--set startblock to', this.startBlock, 'done\n')
      return true;
    } catch (e) {
      console.log('--fetch startblock failed', e)
      return false;
    }
  }
  
  async fetchEndBlock() {
    try {
      console.log('fetch endblock...')
      const res = await fetch(`https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=${this.apiKey}`)
      const data = await res.json()
      this.endBlock = parseInt(data.result, 16);
      console.log('--set endblock to', this.endBlock, 'done\n')
      return true;
    } catch (e) {
      console.log('--fetch endblock failed')
      return false;
    }
  }
  
  async fetchAllTx() {
    const allTxSet = new Set();
    let startblock = this.startBlock;
    while (true) {
      try {
        const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${this.contractAddress}&startblock=${startblock}&end=${this.endBlock}&sort=asc&apikey=${this.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.result.length === 0 || startblock === this.endBlock) {
          break
        }
        // allTx.push(...data.result)
        data.result.forEach((tx) => {
          allTxSet.add(tx)
        })
        console.log('--fetched tx from', startblock, 'to', data.result[data.result.length - 1].blockNumber)
        startblock = data.result[data.result.length - 1].blockNumber
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, 3000)
        })
      } catch (e) {
        console.log('--fetch tx failed')
        process.exit(0)
      }
    }
    return Array.from(allTxSet)
  }
  
  async fetchAllLogsOf(topic0) {
    const allLogSet = new Set();
    let startblock = this.startBlock;
    while (true) {
      try {
        const url = `https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${this.endBlock}&address=${this.contractAddress}&topic0=${topic0}&apikey=${this.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.result.length === 0 || startblock === this.endBlock) {
          break
        }
        data.result.forEach((log) => {
          allLogSet.add(log)
        })
        console.log('--fetched log from', startblock, 'to', BigNumber.from(data.result[data.result.length - 1].blockNumber).toNumber())
        startblock = BigNumber.from(data.result[data.result.length - 1].blockNumber).toNumber()
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, 3000)
        })
      } catch (e) {
        console.log('--fetch log failed')
        return []
      }
    }
    return Array.from(allLogSet)
  }
  
  async handleTx(tx) {
    const methodId = tx.input.slice(0, 10) || tx.methodId;
    switch (methodId) {
      case '0x4a907404':
        await handleNewBuyRequest(tx, this.chainId)
        break;
      case '0x1e6be550':
        await handleNewBuyRequestWithUsdt(tx, this.chainId)
        break;
      case '0xc7998292':
        await handleCancelBuyRequest(tx, this.chainId)
        break;
      case '0x771602f7':
        await handleAdd(tx, this.chainId)
        break;
      case '0x0a90449e':
        await handleSellRequest(tx, this.chainId)
        break;
      case '0x0961c1a0':
        await handleStopPrice(tx, this.chainId)
        break;
      case '0xc6190ed6':
        await handleExecute(tx, this.chainId)
        break;
      default:
        break;
    }
  }
  
  handleNewBuyRequestLog(log) {
    return handleBuyRequestLog(log, this.chainId);
  }
  
  handleBuyLog(log) {
    return handleBuyLog(log, this.chainId);
  }
  
  handleLiquidateLog(log) {
    return handleLiquidateLog(log, this.chainId);
  }
  
  handleSellLog(log) {
    return handleSellLog(log, this.chainId);
  }
}

class Main {
  constructor() {
    this.blockchainData = new BlockchainData(
        '0x02904e03937E6a36D475025212859f1956BeC3f0',
        process.env.BSCSCAN_API_KEY);
  }
  
  async run() {
    // check bscscan api key
    if (!process.env.BSCSCAN_API_KEY) {
      console.log('please set BSCSCAN_API_KEY')
      process.exit(0)
    }
    console.log('start execute', new Date());
    const startBlockSucceed = await this.blockchainData.fetchStartBlock();
    if (!startBlockSucceed) {
      console.log('main function executed failed')
      process.exit(0)
    }
    const endBlockSucceed = await this.blockchainData.fetchEndBlock();
    if (!endBlockSucceed) {
      console.log('main function executed failed')
      process.exit(0)
    }
    console.log('--start fetching all tx')
    const allTx = await this.blockchainData.fetchAllTx();
    console.log('--fetched', allTx.length, 'tx done\n')
    const newBuyRequestTopic = '0xbf4cbb4fa8c0e1d1155a78077bea3d41807ceece161cfae79165e71b82bbeee1'
    console.log('--start fetching newBuyRequest log')
    const allNewBuyRequestLog = await this.blockchainData.fetchAllLogsOf(newBuyRequestTopic);
    console.log('--fetched', allNewBuyRequestLog.length, 'newBuyRequest log done\n')
    const buyTopic = '0xf7735c8cb2a65788ca663fc8415b7c6a66cd6847d58346d8334e8d52a599d3df'
    console.log('--start fetching buy log')
    const allBuyLog = await this.blockchainData.fetchAllLogsOf(buyTopic);
    console.log('--fetched', allBuyLog.length, 'buy log done\n')
    const liquidateTopic = '0xf2bcfabb628d3e0f92291f1e0bc5f2322f8ac3af9e187670152968100e6b60a6'
    console.log('--start fetching liquidate log')
    const allLiquidateLog = await this.blockchainData.fetchAllLogsOf(liquidateTopic);
    console.log('--fetched', allLiquidateLog.length, 'liquidate log done\n')
    const sellTopic = '0xb69e24112cb4483e933dc3bda2d474e8d511e1d7058a983fe98a7d5d78fb9743'
    console.log('--start fetching sell log')
    const allSellLog = await this.blockchainData.fetchAllLogsOf(sellTopic);
    console.log('--fetched', allSellLog.length, 'sell log done\n')
    console.log('handle all newBuyRequest tx...')
    for (const tx of allTx) {
      const methodId = tx.input.slice(0, 10) || tx.methodId;
      if (methodId === '0x4a907404' || methodId === '0x1e6be550') {
        await this.blockchainData.handleTx(tx);
      }
    }
    console.log('--handle all newBuyRequest tx done\n')
    console.log('handle all newBuyRequest log...')
    for (const log of allNewBuyRequestLog) {
      await this.blockchainData.handleNewBuyRequestLog(log);
    }
    console.log('--handle all newBuyRequest log done\n')
    console.log('handle all other tx...')
    for (const tx of allTx) {
      const methodId = tx.input.slice(0, 10) || tx.methodId;
      if (methodId !== '0x4a907404') {
        await this.blockchainData.handleTx(tx);
      }
    }
    console.log('--handle all other tx done\n')
    console.log('handle all buy log...')
    for (const log of allBuyLog) {
      await this.blockchainData.handleBuyLog(log);
    }
    console.log('--handle all buy log done\n')
    console.log('handle all liquidate log...')
    for (const log of allLiquidateLog) {
      await this.blockchainData.handleLiquidateLog(log);
    }
    console.log('--handle all liquidate log done\n')
    
    console.log('handle all sell log...')
    for (const log of allSellLog) {
      await this.blockchainData.handleSellLog(log);
    }
    console.log('--handle all sell log done\n')
  }
}

const main = new Main();

main.run().finally(() => {
  console.log('executed finally:' + new Date())
})