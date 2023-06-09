import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';

dotenv.config();

class Settlement {
  constructor(chainId) {
    this.chainId = chainId
  }
  
  checkDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('date format error')
      return false
    }
    return true
  }
  
  async settlementFutureKOL(date) {
    const settlementMap = {}
    const clearingOrders = await knexInstance('b_clearing_kol')
        .where('date', date)
        .where('status', true)
        .where('settlementStatus', false)
        .where('chainId', this.chainId)
    if (clearingOrders.length === 0) {
      console.log('no clearingOrders to be settled')
      return {}
    }
    const endCheckDate = new Date(date)
    endCheckDate.setDate(endCheckDate.getDate() + 1)
    const kolBlacklist = await knexInstance('f_kol_blacklist')
        .where('type', 1)
        .where('_createTime', '<=', endCheckDate)
    const clearingOrdersWithoutBlacklist = clearingOrders.filter(order => {
      return !kolBlacklist.find(item => item.walletAddress.toLowerCase() === order.walletAddress.toLowerCase())
    })
    for (let i = 0; i < clearingOrdersWithoutBlacklist.length; i++) {
      const {walletAddress, reward} = clearingOrdersWithoutBlacklist[i]
      if (reward <= 0) {
        continue
      }
      if (!settlementMap[walletAddress]) {
        settlementMap[walletAddress] = {
          settlementAmount: 0,
          settlementCurrency: 'NEST',
          chainId: this.chainId,
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
      console.log('date is error')
      return
    }
    
    console.log('settle:', date)
    
    const settlementFutureKOLMap = await this.settlementFutureKOL(date)
    
    if (Object.keys(settlementFutureKOLMap).length === 0) {
      console.log('no settlementFutureKOLMap')
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
      const walletAddresses = Object.keys(settlementFutureKOLMap)
      await trx('b_settlement').insert(settlementOrders)
      await trx('b_clearing_kol')
          .where('date', date)
          .where('status', true)
          .where('chainId', this.chainId)
          .whereRaw(`LOWER(walletAddress) in (${walletAddresses.map(address => `'${address}'`).join(',')})`)
          .where('settlementStatus', false)
          .update({settlementStatus: true})
      await trx.commit()
      console.log('--settle done')
    } catch (e) {
      console.log('settle error', e)
      await trx.rollback()
    }
  }
  
  async handleYesterday() {
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday = yesterday.toISOString().slice(0, 10)
    await this.settle(yesterday)
  }
  
  async handleHistory() {
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    let date = new Date('2023-04-06T00:00:00.000Z')
    while (date < yesterday) {
      const dateString = date.toISOString().slice(0, 10)
      await this.settle(dateString)
      date.setDate(date.getDate() + 1)
    }
  }
}

export default Settlement

// (async () => {
//   const bsc = new Settlement(56);
//   // const scroll = new Settlement(534353);
//
//   await bsc.handleYesterday();
//   console.log('bsc executed finally:' + new Date());
//   // await scroll.handleYesterday()
//   // console.log('scroll executed finally:' + new Date());
//
//   // bsc.handleHistory().catch(e => {
//   //   console.log('clearing history error', e)
//   // })
// })()
