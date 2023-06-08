import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';
import moment from "moment";

dotenv.config();

class Clearing {
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
  
  getClearingData(orders, relationships, level, status) {
    const clearingData = {}
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const orderAddress = order.walletAddress.toLowerCase()
      const volume = order.volume
      const fee = order.fees
      
      // 查询订单持有人的一级邀请人和二级邀请人
      // 清算 level 关系的数据
      const relationship = relationships.find(item => item.inviteeWalletAddress.toLowerCase() === orderAddress && item.relationshipLevel === level)
      // 需要确保 relationship 的创建时间在订单的创建时间之前
      // 注意：在生成二级关系的时候，_createTime需要设置为同一级关系一样的时间
      if (relationship && relationship._createTime > order.timeStamp) {
        continue
      }
      if (relationship && relationship?.inviterWalletAddress) {
        const inviterAddress = relationship.inviterWalletAddress.toLowerCase()
        // clearingData 是一个字典，保存各个地址的聚合数据
        clearingData[inviterAddress] = clearingData[inviterAddress] || {
          tradingVolume: 0,
          fees: 0,
          dailyActiveUsers: new Set(),
          dailyUserTransactions: 0,
          dailyDestruction: 0,
          reward: 0,
          status,
          level,
        }
        clearingData[inviterAddress].tradingVolume += volume
        clearingData[inviterAddress].fees += fee
        clearingData[inviterAddress].dailyActiveUsers.add(orderAddress)
        clearingData[inviterAddress].dailyUserTransactions += 1
        if (relationship.rewardRatio) {
          clearingData[inviterAddress].reward += Number((fee * relationship.rewardRatio).toFixed(2))
        }
        if (order.orderType === 'MARKET_CLOSE_FEE' || order.orderType === 'TP_ORDER_FEE' ||
            order.orderType === 'SL_ORDER_FEE' || order.orderType === 'MARKET_LIQUIDATION') {
          clearingData[inviterAddress].dailyDestruction += (order.sellValue - order.margin)
        }
      }
    }
    return clearingData
  }
  
  async insertClearingData(clearingData, date, trx) {
    for (const address in clearingData) {
      const data = clearingData[address]
      await trx('b_clearing_kol').insert({
        date,
        walletAddress: address,
        relationshipLevel: data.level,
        chainId: this.chainId,
        tradingVolume: data.tradingVolume,
        fees: data.fees,
        reward: data.reward,
        dailyActiveUsers: data.dailyActiveUsers.size,
        dailyUserTransactions: data.dailyUserTransactions,
        dailyDestruction: data.dailyDestruction,
        status: data.status,
      })
    }
  }
  
  async clearing(date) {
    if (!this.checkDate(date)) {
      console.log('date is error')
      return
    }
    
    const start = moment(date).format('YYYY-MM-DDTHH:mm:ssZ')
    const end = moment(date).add(1, 'days').format('YYYY-MM-DDTHH:mm:ssZ')
    
    console.log('clearing future for kol\n--start:', start, 'end:', end)
    
    const orders = await knexInstance('f_future_trading')
        .whereBetween('timeStamp', [start, end])
        .where('chainId', this.chainId)
        .where('status', true)
        .whereIn('orderType', ['MARKET_CLOSE_FEE', 'TP_ORDER_FEE', 'SL_ORDER_FEE',
          'MARKET_LIQUIDATION', 'MARKET_ORDER_FEE', 'LIMIT_ORDER_FEE'])
        .where('clearingStatus', false)
    console.log('--find orders:', orders.length)
    if (orders.length === 0) {
      console.log('no orders to be cleared')
      return
    }
    // 根据单号持有人地址，查询他们所有对应，尚在有效期内的邀请关系
    // status = invited
    // 遍历所有订单，根据订单的持有人地址，查询他们所有对应，尚在有效期内的邀请关系
    let addresses = orders.map(order => order.walletAddress.toLowerCase())
    addresses = [...new Set(addresses)]
    console.log('--find addresses:', addresses.length)
    // 查询用户是否在黑名单中，以及类型是不对 KOL 返佣，若是，则排除这部分用户
    let blackList = await knexInstance('f_user_blacklist')
        .whereRaw(`LOWER(walletAddress) in (${addresses.map(address => `'${address}'`).join(',')})`)
        .where('type', 1)
        .select('walletAddress')
    blackList = blackList.map(item => item.walletAddress.toLowerCase())
    console.log('--find blacklist:', blackList.length)
    const filteredAddresses = addresses.filter(address => !blackList.includes(address))
    console.log('--find filteredAddresses:', filteredAddresses.length)
    const trx = await knexInstance.transaction()
    // 5. 与上步操作原子性地，更新对应的单号所有记录，标记为已清算
    // 插入清算表，同时更新订单表，设置为已清算
    try {
      if (filteredAddresses.length === 0) {
        console.log('no addresses to be cleared')
      } else {
        // 查询所有层级的邀请关系
        const relationshipsWithoutBlacklist = await knexInstance('f_user_relationship')
            .whereRaw(`LOWER(inviteeWalletAddress) in (${filteredAddresses.map(address => `'${address}'`).join(',')})`)
            // 初步筛选出有效期内的邀请关系
            .where('_createTime', '<=', end)
            .where('status', 'invited')
        console.log('--find relationship:', relationshipsWithoutBlacklist.length)
        const l1clearingDataWithoutBlacklist = this.getClearingData(orders, relationshipsWithoutBlacklist, 1, true)
        const l2clearingDataWithoutBlacklist = this.getClearingData(orders, relationshipsWithoutBlacklist, 2, true)
        try {
          await this.insertClearingData(l1clearingDataWithoutBlacklist, date, trx)
          await this.insertClearingData(l2clearingDataWithoutBlacklist, date, trx)
        } catch (e) {
          console.log('insert clearing data error:', e)
          return
        }
      }
      if (blackList.length === 0) {
        console.log('no blacklist to be cleared')
      } else {
        const relationshipsOfBlacklist = await knexInstance('f_user_relationship')
            .whereRaw(`LOWER(inviteeWalletAddress) in (${blackList.map(address => `'${address}'`).join(',')})`)
            // 初步筛选出有效期内的邀请关系
            .where('_createTime', '<=', end)
            .where('status', 'invited')
        const l1clearingDataOfBlacklist = this.getClearingData(orders, relationshipsOfBlacklist, 1, false)
        const l2clearingDataOfBlacklist = this.getClearingData(orders, relationshipsOfBlacklist, 2, false)
        await this.insertClearingData(l1clearingDataOfBlacklist, date, trx)
        await this.insertClearingData(l2clearingDataOfBlacklist, date, trx)
      }
      await trx('f_future_trading')
          .whereIn('_id', orders.map(order => order._id))
          .update({
            clearingStatus: true,
          })
      await trx.commit();
      console.log('trx.commit')
    } catch (e) {
      await trx.rollback()
      console.log('trx.rollback', e)
    }
  }
  
  async handleYesterday() {
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday = yesterday.toISOString().slice(0, 10)
    await this.clearing(yesterday)
  }
  
  async handleHistory() {
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    let date = new Date('2023-04-06T08:00:00.000Z')
    while (date < yesterday) {
      const dateString = date.toISOString().slice(0, 10)
      await this.clearing(dateString)
      date.setDate(date.getDate() + 1)
    }
  }
}

(async () => {
  const bsc = new Clearing(56);
  // const scroll = new ClearingFuture(534353);
  
  bsc.handleYesterday().then(() => {
    console.log('bsc executed finally:' + new Date());
  })
  // scroll.handleYesterday().then(() => {
  //   console.log('scroll executed finally:' + new Date());
  // })
})();

// clearing.handleHistory().catch(e => {
//   console.log('clearing history error', e)
// }).finally(() => {
//   console.log('executed finally:' + new Date())
//   process.exit(0)
// })