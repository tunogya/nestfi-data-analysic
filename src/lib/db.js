import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
})

export const saveFuturePrice = async (data) => {
  const {blocknumber, hash, timestamp, gasfee, walletaddress, chainid, ethprice, btcprice, bnbprice, status, positionindices} = data;
  const positionindicesstring = `{${positionindices.join(',')}}`
  try {
    await sql`
        INSERT INTO f_future_price
        (blocknumber, hash, timestamp, gasfee, walletaddress, chainid, ethprice, btcprice, bnbprice, status,
         positionindices)
        VALUES (${blocknumber}, ${hash}, ${timestamp}, ${gasfee}, ${walletaddress}, ${chainid}, ${ethprice},
                ${btcprice}, ${bnbprice}, ${status}, ${positionindicesstring})
        ON CONFLICT (hash, chainid) DO NOTHING;
    `
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
    await sql`
        INSERT INTO f_future_trading
        (blocknumber, hash, timestamp, gasfee, product, currency, chainid, positionindex, leverage, orderprice, ordertype,
         direction,
         margin, volume, stoplossprice, takeprofitprice, fees, executionfees, walletaddress, status)
        VALUES (${blocknumber}, ${hash}, ${timestamp}, ${gasfee}, ${product}, ${currency}, ${chainid}, ${positionindex}, ${leverage},
                ${orderprice}, ${ordertype}, ${direction}, ${margin}, ${volume}, ${stoplossprice}, ${takeprofitprice},
                ${fees}, ${executionfees}, ${walletaddress}, ${status})
        ON CONFLICT (hash, ordertype) DO NOTHING;
    `
    // console.log('save FutureTrading success')
  } catch (e) {
    console.log('--save FutureTrading error')
    console.log(e)
  }
}

export const getExecutePrice = async (hash, chainId, product) => {
  const prices = await sql`
      SELECT *
      FROM f_future_price
      WHERE hash = ${hash}
        AND chainid = ${chainId}
  `
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
  const orders = await sql`
      SELECT *
      FROM f_future_trading
      WHERE positionindex = ${positionindex}
        AND chainid = ${chainid}
        AND timestamp < ${timestamp}
        AND status = true
      ORDER BY timestamp DESC
  `
  if (orders.length === 0) {
    console.log(`db error: positionIndex: ${positionindex}, chainId: ${chainid}, timeStamp: ${timestamp}`)
    return null
  }
  return orders[0];
}

export default sql
