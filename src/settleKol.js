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
    if (clearingOrders.length === 0) {
      console.log('no clearingOrders to be settled')
      return
    }
    for (let i = 0; i < clearingOrders.length; i++) {
      const {walletAddress, reward, chainId} = clearingOrders[i]
      if (!settlementMap[walletAddress]) {
        settlementMap[walletAddress] = {
          settlementAmount: 0,
          settlementCurrency: 'NEST',
          chainId,
        }
      }
      settlementMap[walletAddress].settlementAmount += reward
    }
    // 插入结算表，更新清算表，使用事务
    const trx = await knexInstance.transaction()
    try {
      const settlementOrders = Object.keys(settlementMap).map(walletAddress => {
        const {settlementAmount, settlementCurrency, chainId} = settlementMap[walletAddress]
        return {
          walletAddress,
          settlementAmount,
          settlementCurrency,
          chainId,
          date,
        }
      })
      await trx('b_settlement').insert(settlementOrders)
      await trx('b_clearing_kol')
          .where('date', date)
          .where('status', true)
          .where('settlementStatus', false)
          .update({settlementStatus: true})
      await trx.commit()
      console.log('--settle done')
    } catch (e) {
      console.log('settle error', e)
      await trx.rollback()
    }
  }
  async start() {
    await this.settle('2023-05-07')
  }
}

const main = new Main()

main.start().catch(e => {
  console.log('main.start error', e)
}).finally(() => {
  process.exit(0)
})