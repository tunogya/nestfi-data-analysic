import dotenv from 'dotenv';
import {FullAsyncBlock} from "./asyncBlock.js";

dotenv.config();

(async () => {
  const bsc = new FullAsyncBlock(56);
  const scroll = new FullAsyncBlock(534353);
  
  while (true) {
    await bsc.run()
    console.log('bsc executed finally:' + new Date());
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
    await scroll.run()
    console.log('scroll executed finally:' + new Date());
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
  }
})();