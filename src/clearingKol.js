import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';

dotenv.config();

class Clearing {
  constructor() {
  }
  
  
  async start(date) {
    if (!this.dateIsValid(date)) {
      console.log('date format error')
      return
    }
    const orders = await this.getOrders(date)
    console.log('Found orders:', orders.length)
    if (orders.length === 0) {
      console.log('No orders to be cleared')
      return
    }
    const relationships = await this.getRelationships(orders)
    console.log('Found relationships:', relationships.length)
    const filteredAddresses = this.filterBlackList(orders)
    console.log('Found filteredAddresses:', filteredAddresses.length)
    const [l1clearingData, l2clearingData] = this.calculateClearingData(orders, relationships)
    await knexInstance.transaction(async trx => {
          try {
            await this.updateClearing(trx, orders)
            await this.saveClearingData(trx, date, l1clearingData, 1)
            await this.saveClearingData(trx, date, l2clearingData, 2)
            await trx.commit();
            console.log('trx.commit')
          } catch (e) {
            await trx.rollback()
            console.log('trx.rollback', e)
          }
        }
    )
  
  }
  
  async getOrders(date) {
    const start = new Date(date + 'T00:00:00.000Z')
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    console.log('Clearing future for kol\n--start:', start, 'end:', end)
    return knexInstance('f_future_trading')
        .where('timeStamp', '>=', start)
        .where('timeStamp', '<', end)
        .where('status', true)
        .whereIn('orderType', ['MARKET_CLOSE_FEE', 'TP_ORDER_FEE', 'SL_ORDER_FEE',
          'MARKET_LIQUIDATION', 'MARKET_ORDER_FEE', 'LIMIT_ORDER_FEE'])
        .where('clearingStatus', false);
  }
  
  
  async getRelationships(orders) {
    const addresses = orders.map(order => order.walletAddress.toLowerCase())
    return knexInstance('f_user_relationship')
        .whereIn('inviteeWalletAddress', addresses)
        .where('status', 'invited');
  }
  
  
  async filterBlackList(orders) {
    const addresses = orders.map(order => order.walletAddress.toLowerCase())
    let blackList = await knexInstance('f_user_blacklist')
        .whereIn('walletAddress', addresses)
        .where('type', 1)
        .select('walletAddress')
    blackList = blackList.map(item => item.walletAddress.toLowerCase())
    console.log('--find blacklist:', blackList.length)
    return addresses.filter(address => !blackList.includes(address))
  }
  
  
  calculateClearingData(orders, relationships) {
    const l1clearingData = {}, l2clearingData = {}
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const orderAddress = order.walletAddress.toLowerCase()
      const volume = order.volume
      const fee = order.fees
      const [l1Relationship, l2Relationship] = this.getRelationship(relationships, orderAddress)
      
      const addToClearingData = (data, address, rewardRatio) => {
        data[address] = data[address] || {
          tradingVolume: 0,
          fees: 0,
          dailyActiveUsers: new Set(),
          dailyUserTransactions: 0,
          dailyDestruction: 0,
          reward: 0,
        }
        data[address].tradingVolume += volume
        data[address].fees += fee
        data[address].dailyActiveUsers.add(orderAddress)
        data[address].dailyUserTransactions += 1
        if (rewardRatio) {
          data[address].reward += Number((fee * rewardRatio).toFixed(2))
        } else {
          console.log('rewardRatio is null')
        }
        if (order.orderType === 'MARKET_CLOSE_FEE' || order.orderType === 'TP_ORDER_FEE' ||
            order.orderType === 'SL_ORDER_FEE' || order.orderType === 'MARKET_LIQUIDATION') {
          data[address].dailyDestruction += (order.sellValue - order.margin)
        }
      }
      
      if (l1Relationship) {
        addToClearingData(l1clearingData, l1Relationship.inviterWalletAddress, l1Relationship.rewardRatio)
      }
      
      if (l2Relationship) {
        addToClearingData(l2clearingData, l2Relationship.inviterWalletAddress, l2Relationship.rewardRatio)
      }
    }
    return [l1clearingData, l2clearingData]
    
  }
  
  async updateClearing(trx, orders) {
    await trx('f_future_trading')
        .whereIn('_id', orders.map(order => order._id))
        .update({
          clearingStatus: true,
        })
  }
  
  async saveClearingData(trx, date, clearingData, level) {
    const records = []
    for (const address in clearingData) {
      const data = clearingData[address]
      records.push({
        date: date,
        walletAddress: address,
        relationshipLevel: level,
        chainId: 56,
        tradingVolume: data.tradingVolume,
        fees: data.fees,
        reward: data.reward,
        dailyActiveUsers: data.dailyActiveUsers.size,
        dailyUserTransactions: data.dailyUserTransactions,
        dailyDestruction: data.dailyDestruction,
      })
    }
    if (records.length > 0) {
      await trx('b_clearing_kol').insert(records)
    }
  }
  
  dateIsValid(date) {
    return /^\d{4}-d2{2}$/.test(date)
  }
  
  getRelationship(relationships, inviteeWalletAddress) {
    const l1Relationship = relationships.find(item => item.inviteeWalletAddress.toLowerCase() === inviteeWalletAddress && item.relationshipLevel === 1)
    const l2Relationship = relationships.find(item => item.inviteeWalletAddress.toLowerCase() === inviteeWalletAddress && item.relationshipLevel === 2)
    return [l1Relationship, l2Relationship]
  }
}

const clearing = new Clearing()
clearing.start('2023-11-30')
    .catch((e) => {
      console.log('Clearing start error', e)
    })
    .finally(() => {
      process.exit(0)
    })