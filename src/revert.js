import knexInstance from "./lib/db.js";

class Revert {
  checkDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('date format error')
      return false
    }
    return true
  }
  
  async revert(start, end) {
    if (!this.checkDate(start)) {
      console.log('start date is error')
      return
    }
    if (!this.checkDate(end)) {
      console.log('end date is error')
      return
    }
    const startDate = new Date(start + 'T00:00:00.000Z')
    const endDate = new Date(end + 'T23:59:59.000Z')
    console.log('startDate', startDate)
    console.log('endDate', endDate)
    // 清空交易数据
    await knexInstance('f_future_trading')
        .where('timeStamp', '>=', startDate)
        .where('timeStamp', '<=', endDate)
        .update({
          clearingStatus: false,
        })
    console.log('清空交易数据成功')
    // 清空清算数据
    //
    await knexInstance('b_clearing_kol')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .del()
    console.log('清空清算数据成功')
    // // 清空结算数据
    await knexInstance('b_settlement')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .del()
    console.log('清空结算数据成功')
  }
}

(async () => {
  const revert = new Revert()
  await revert.revert('2023-04-6', '2023-07-1')
  process.exit(0)
})();