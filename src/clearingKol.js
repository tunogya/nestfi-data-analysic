import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';

dotenv.config();

class Main {
  constructor() {
  
  }
  
  async clearing(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('date format error')
      return
    }
    const start = new Date(date + 'T00:00:00.000Z')
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    console.log('clearing future for kol\n--start:', start, 'end:', end)
    const orders = await knexInstance('f_future_trading')
        .where('timeStamp', '>=', start)
        .where('timeStamp', '<', end)
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
    const addresses = orders.map(order => order.walletAddress.toLowerCase())
    console.log('--find user:', addresses.length)
    // 查询用户是否在黑名单中，以及类型是不对 KOL 返佣，若是，则排除这部分用户
    let blackList = await knexInstance('f_user_blacklist')
        .whereRaw(`LOWER(walletAddress) in (${addresses.map(address => `'${address}'`).join(',')})`)
        .where('type', 1)
        .select('walletAddress')
    blackList = blackList.map(item => item.walletAddress.toLowerCase())
    console.log('--find blacklist:', blackList.length)
    const filteredAddresses = addresses.filter(address => !blackList.includes(address))
    console.log('--find filteredAddresses:', filteredAddresses.length)
    // 查询所有层级的邀请关系
    const relationships = await knexInstance('f_user_relationship')
        .whereRaw(`LOWER(inviteeWalletAddress) in (${filteredAddresses.map(address => `'${address}'`).join(',')})`)
        .where('status', 'invited')
    console.log('--find relationship:', relationships.length)
    // 遍历 orders，查询邀请关系，计算出 KOL 当天的聚合数据，得出清算表
    // tradingVolume KOL该日该地址带来的交易量汇总(NEST) volume，
    // fees KOL该日该地址带来的手续费汇总(NEST)
    // dailyActiveUsers KOL该日该地址带来的活跃用户数
    // dailyUserTransactions KOL该日该地址带来的交易人次
    // dailyDestruction 只有平仓和爆仓才计算销毁 KOL该日该地址带来的销毁量（正数代表增发）(NEST） "实际到账金额/（1-0.05%）-初始保障金（没有手续费）- 追加保证金
    //    加爆仓全部金额（初始保证金+追加保证金）"
    const l1clearingData = {}, l2clearingData = {}
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const orderAddress = order.walletAddress.toLowerCase()
      const volume = order.volume
      const fee = order.fees
      
      // 查询订单持有人的一级邀请人和二级邀请人
      // 清算 L1 关系的数据
      const l1Relationship = relationships.find(item => item.inviteeWalletAddress.toLowerCase() === orderAddress && item.relationshipLevel === 1)
      if (l1Relationship?.inviterWalletAddress) {
        const l1Address = l1Relationship.inviterWalletAddress.toLowerCase()
        // l1clearingData 是一个字典，保存各个地址的聚合数据
        l1clearingData[l1Address] = l1clearingData[l1Address] || {
          tradingVolume: 0,
          fees: 0,
          dailyActiveUsers: new Set(),
          dailyUserTransactions: 0,
          dailyDestruction: 0,
          reward: 0,
        }
        l1clearingData[l1Address].tradingVolume += volume
        l1clearingData[l1Address].fees += fee
        l1clearingData[l1Address].dailyActiveUsers.add(orderAddress)
        l1clearingData[l1Address].dailyUserTransactions += 1
        if (l1Relationship.rewardRatio) {
          l1clearingData[l1Address].reward += Number((fee * l1Relationship.rewardRatio).toFixed(2))
        } else {
          console.log('l1Relationship.rewardRatio is null', l1Relationship)
        }
        if (order.orderType === 'MARKET_CLOSE_FEE' || order.orderType === 'TP_ORDER_FEE' ||
            order.orderType === 'SL_ORDER_FEE' || order.orderType === 'MARKET_LIQUIDATION') {
          l1clearingData[l1Address].dailyDestruction += (order.sellValue - order.margin)
        }
      }
      // 清算 L2 关系的数据
      const l2Relationship = relationships.find(item => item.inviteeWalletAddress.toLowerCase() === orderAddress && item.relationshipLevel === 2)
      if (l2Relationship?.inviterWalletAddress) {
        const l2Address = l2Relationship.inviterWalletAddress.toLowerCase()
        l2clearingData[l2Address] = l2clearingData[l2Address] || {
          tradingVolume: 0,
          fees: 0,
          dailyActiveUsers: new Set(),
          dailyUserTransactions: 0,
          dailyDestruction: 0,
          reward: 0,
        }
        l2clearingData[l2Address].tradingVolume += volume
        l2clearingData[l2Address].fees += fee
        l2clearingData[l2Address].dailyActiveUsers.add(orderAddress)
        l2clearingData[l2Address].dailyUserTransactions += 1
        if (l2Relationship.rewardRatio) {
          l2clearingData[l2Address].reward += Number((fee * l2Relationship.rewardRatio).toFixed(2))
        } else {
          console.log('l2Relationship.rewardRatio is null', l2Relationship)
        }
        
        if (order.orderType === 'MARKET_CLOSE_FEE' || order.orderType === 'TP_ORDER_FEE' ||
            order.orderType === 'SL_ORDER_FEE' || order.orderType === 'MARKET_LIQUIDATION') {
          l2clearingData[l2Address].dailyDestruction += (order.sellValue - order.margin)
        }
      }
    }
    // 5. 与上步操作原子性地，更新对应的单号所有记录，标记为已清算
    // 插入清算表，同时更新订单表，设置为已清算
    const trx = await knexInstance.transaction()
    try {
      // 遍历字典l1Relationship和l2Relationship，插入清算表
      for (const address in l1clearingData) {
        const data = l1clearingData[address]
        await trx('b_clearing_kol').insert({
          date: date,
          walletAddress: address,
          relationshipLevel: 1,
          chainId: 56,
          tradingVolume: data.tradingVolume,
          fees: data.fees,
          reward: data.reward,
          dailyActiveUsers: data.dailyActiveUsers.size,
          dailyUserTransactions: data.dailyUserTransactions,
          dailyDestruction: data.dailyDestruction,
          status: true,
        })
      }
      for (const address in l2clearingData) {
        const data = l2clearingData[address]
        await trx('b_clearing_kol').insert({
          date: date,
          walletAddress: address,
          relationshipLevel: 2,
          chainId: 56,
          tradingVolume: data.tradingVolume,
          fees: data.fees,
          reward: data.reward,
          dailyActiveUsers: data.dailyActiveUsers.size,
          dailyUserTransactions: data.dailyUserTransactions,
          dailyDestruction: data.dailyDestruction,
          status: true,
        })
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
  
  async start() {
    // let yesterday = new Date()
    // yesterday.setDate(yesterday.getDate() - 1)
    // yesterday = yesterday.toISOString().slice(0, 10)
    // await this.clearing(yesterday)
    await this.clearing('2023-05-01')
    await this.clearing('2023-05-02')
    await this.clearing('2023-05-03')
    await this.clearing('2023-05-04')
    await this.clearing('2023-05-05')
    await this.clearing('2023-05-06')
  }
}

const main = new Main()

main.start()
    .catch(e => {
      console.log('main.start error', e)
    })
    .finally(() => {
      process.exit(0)
    })