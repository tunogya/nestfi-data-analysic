import dotenv from 'dotenv';
import knex from "knex";

dotenv.config();

const knexInstance = knex({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_SCHEMA
  }
});

export const getExecutePrice = async (hash, chainId, product) => {
  const prices = await knexInstance('f_future_price')
      .where({hash, chainId})
  
  if (prices.length === 0) {
    console.log(`db error: hash: ${hash}, chainId: ${chainId}`)
    return
  }
  let orderPrice = null
  const price = prices[0];
  if (product === 'ETH/USDT') {
    orderPrice = price.ethprice
  } else if (product === 'BTC/USDT') {
    orderPrice = price.btcprice
  } else if (product === 'BNB/USDT') {
    orderPrice = price.bnbprice
  } else if (product === 'MATIC/USDT') {
    orderPrice = price.maticprice
  } else if (product === 'ADA/USDT') {
    orderPrice = price.adaprice
  } else if (product === 'DOGE/USDT') {
    orderPrice = price.dogeprice
  } else if (product === 'XRP/USDT') {
    orderPrice = price.xrpprice
  }
  return orderPrice
}

export const getPreviousOrderState = async (positionIndex, chainId, timeStamp) => {
  // 寻找同一单号的最新信息，timeStamp < timeStamp, 倒序排列
  const orders = await knexInstance('f_future_trading').where({
    positionIndex,
    chainId
  })
      .where('timeStamp', '<', new Date(timeStamp * 1000))
      .where({status: true})
      .orderBy('timeStamp', 'desc')
  if (orders.length === 0) {
    console.log(`db error: positionIndex: ${positionIndex}, chainId: ${chainId}, timeStamp: ${timeStamp}`)
    return null
  }
  return orders[0];
}

export default knexInstance
