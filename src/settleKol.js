import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';

dotenv.config();

class Main {
  constructor() {
  
  }
  
  checkDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('date format error')
      return false
    }
    return true
  }
  
  async settlementFutureKOL(date, chainId) {
    const settlementMap = {}
    const clearingOrders = await knexInstance('b_clearing_kol')
        .where('date', date)
        .where('status', true)
        .where('settlementStatus', false)
        .where('chainId', chainId)
    if (clearingOrders.length === 0) {
      console.log('no clearingOrders to be settled')
      return {}
    }
    for (let i = 0; i < clearingOrders.length; i++) {
      const {walletAddress, reward} = clearingOrders[i]
      if (!settlementMap[walletAddress]) {
        settlementMap[walletAddress] = {
          settlementAmount: 0,
          settlementCurrency: 'NEST',
          chainId,
          type: 'future'
        }
      }
      settlementMap[walletAddress].settlementAmount += reward
    }
    return settlementMap
  }
  
  async settle(date) {
    // 1. 找到 date 当天所有的未被结算的清算表记录
    if (!this.checkDate(date)) {
      return
    }
    
    const settlementFutureKOLMap = await this.settlementFutureKOL(date, 56)
    
    if (Object.keys(settlementFutureKOLMap).length === 0) {
      return
    }
    
    // 插入结算表，更新清算表，使用事务
    const trx = await knexInstance.transaction()
    try {
      const settlementOrders = Object.keys(settlementFutureKOLMap).map(walletAddress => {
        const {settlementAmount, settlementCurrency, chainId, type} = settlementFutureKOLMap[walletAddress]
        return {
          walletAddress,
          settlementAmount,
          settlementCurrency,
          chainId,
          date,
          type
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
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday = yesterday.toISOString().slice(0, 10)
    await this.settle(yesterday)
  }
}

const main = new Main()

main.start().catch(e => {
  console.log('main.start error', e)
}).finally(() => {
  console.log('executed finally:' + new Date())
})