import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';

dotenv.config();

class Main {
  constructor() {
  
  }
  
  async settle(date) {
    // 1. 找到 date 当天所有的未被结算的清算表记录
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('date format error')
      return
    }
    const clearingOrders = await knexInstance('b_clearing_kol')
        .where('date', date)
        .where('status', true)
        .where('settlementStatus', false)
    console.log('--find clearingOrders:', clearingOrders.length)
    const settlementMap = {}
    for (let i = 0; i < clearingOrders.length; i++) {
      const { walletAddress, reward } = clearingOrders[i]
      if (!settlementMap[walletAddress]) {
        settlementMap[walletAddress] = 0
      }
      settlementMap[walletAddress] += reward
    }
    console.log(settlementMap)
  }
  
  
  async start() {
    await this.settle('2023-05-01')
  }
}

const main = new Main()

main.start().catch(e => {
  console.log('main.start error', e)
}).finally(() => {
  process.exit(0)
})