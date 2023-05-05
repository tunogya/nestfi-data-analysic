class Main {
  constructor() {
  
  }
  
  async clearing(date) {
    // 1. 查询 date(UTC) 当天的所有交易，筛选出未被清算的所有平仓和爆仓的交易
    // MARKET_CLOSE_FEE
    // TP_ORDER_FEE
    // SL_ORDER_FEE
    // MARKET_LIQUIDATION
    // 开仓交易需要被清算
    
    // 2. 根据单号持有人地址，查询他们所有对应，尚在有效期内的邀请关系
    // status = invited
    
    // 3. 查询用户是否在黑名单中，以及类型是不对 KOL 返佣，若是，则排除这部分用户
    // type = 'non commissionable'
    
    // 4. 根据邀请关系，计算出 KOL 当天的聚合数据，得出清算表
    // 需要确保各个层级关系记录的 ratio 字段被正确的计算
    // tradingVolume KOL该日该地址带来的交易量汇总(NEST) volume，
    // fees KOL该日该地址带来的手续费汇总(NEST)
    // dailyActiveUsers KOL该日该地址带来的活跃用户数
    // dailyUserTransactions KOL该日该地址带来的交易人次
    // dailyDestruction 只有平仓和爆仓才计算销毁 KOL该日该地址带来的销毁量（正数代表增发）(NEST） "实际到账金额/（1-0.05%）-初始保障金（没有手续费）- 追加保证金
    //    加爆仓全部金额（初始保证金+追加保证金）"
    
    // 5. 与上步操作原子性地，更新对应的单号所有记录，标记为已清算
    
    // 6. 当天可多次执行，直到所有记录都被清算
  }
  
  async start() {
  
  }
}

const main = new Main()

main.start().finally(() => {
  process.exit(0)
})