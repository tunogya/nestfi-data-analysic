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

export const saveFuturePrice = async (data) => {
  const {
    blocknumber,
    hash,
    timestamp,
    gasfee,
    walletaddress,
    chainid,
    ethprice,
    btcprice,
    bnbprice,
    status,
    positionindices
  } = data;
  const positionindicesstring = `[${positionindices.join(',')}]`
  try {
    knexInstance('f_future_price').insert({
      blocknumber,
      hash,
      timestamp,
      gasfee,
      walletaddress,
      chainid,
      ethprice,
      btcprice,
      bnbprice,
      status,
    }).onConflict(['hash', 'chainid']).ignore()
    // console.log('save Future Price success')
  } catch (e) {
    console.log(`save Future Price error`)
    console.log(e)
  }
}

export const saveFutureTrading = async (data) => {
  const {
    chainid,
    hash,
    blocknumber,
    timestamp,
    gasfee,
    product,
    currency,
    leverage,
    orderprice,
    ordertype,
    direction,
    margin,
    volume,
    stoplossprice,
    takeprofitprice,
    positionindex,
    fees,
    executionfees,
    walletaddress,
    status
  } = data;
  try {
    await knexInstance('f_future_trading').insert({
      blocknumber,
      hash,
      timestamp,
      gasfee,
      product,
      currency,
      chainid,
      positionindex,
      leverage,
      orderprice,
      ordertype,
      direction,
      margin,
      volume,
      stoplossprice,
      takeprofitprice,
      fees,
      executionfees,
      walletaddress,
      status
    }).onConflict(['hash', 'ordertype']).ignore()
    // console.log('save FutureTrading success')
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export const getExecutePrice = async (hash, chainId, product) => {
  const prices = await knexInstance('f_future_price').where({hash, chainid: chainId})
  
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
      .where('timestamp', '<', timestamp)
      .where({status: true})
      .orderBy('timestamp', 'desc')
  if (orders.length === 0) {
    console.log(`db error: positionIndex: ${positionindex}, chainId: ${chainid}, timeStamp: ${timestamp}`)
    return null
  }
  return orders[0];
}

export default knexInstance
