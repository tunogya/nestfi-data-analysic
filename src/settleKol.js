import knexInstance from "./lib/db.js";
import dotenv from 'dotenv';

dotenv.config();

class Main {
  constructor() {
  
  }
  
  async settle(date) {
    // 1. 找到 date 当天所有的未被结算的清算表记录
    
    
    
    
  }
  
  async start() {
  
  }
}

const main = new Main()

main.start().finally(() => {
  process.exit(0)
})