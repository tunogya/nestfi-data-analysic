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

export const getExecutePrice = async (hash, chainid, product) => {
  const prices = await knexInstance('f_future_price')
      .select('ethprice', 'btcprice', 'bnbprice')
      .where({hash, chainid})
  
  if (prices.length === 0) return;
  let orderPrice = null
  const price = prices[0];
  if (product === 'ETH/USDT') {
    orderPrice = price.ethprice
  } else if (product === 'BTC/USDT') {
    orderPrice = price.btcprice
  } else if (product === 'BNB/USDT') {
    orderPrice = price.bnbprice
  }
  return orderPrice
}

export const getPreviousOrderState = async (positionindex, chainid, timestamp) => {
  // 寻找同一单号的最新信息，timestamp < timeStamp, 倒序排列
  const orders = await knexInstance('f_future_trading').where({
    positionindex,
    chainid
  })
      .where('timestamp', '<', new Date(timestamp * 1000))
      .where({status: true})
      .orderBy('timestamp', 'desc')
  if (orders.length === 0) {
    console.log(`db error: positionIndex: ${positionindex}, chainId: ${chainid}, timeStamp: ${timestamp}`)
    return null
  }
  return orders[0];
}

export default knexInstance
