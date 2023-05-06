class Main {
  constructor() {
  
  }
  
  async settle(date) {
    // 1. 找到 date 当天所有的未被结算的清算表记录
    
    // 2. 处理结算余额信息，写入数据库
    
    // 3. 待人工审核处理后，自行标记付款凭证
  }
  
  async start() {
  
  }
}

const main = new Main()

main.start().finally(() => {
  process.exit(0)
})