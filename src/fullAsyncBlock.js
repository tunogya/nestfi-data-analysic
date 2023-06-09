import dotenv from 'dotenv';
import {FullAsyncBlock} from "./asyncBlock.js";

dotenv.config();

(async () => {
  const bsc = new FullAsyncBlock(56);
  const scroll = new FullAsyncBlock(534353);
  
  await bsc.run()
  console.log('bsc executed finally:' + new Date());
  await scroll.run()
  console.log('scroll executed finally:' + new Date());
  process.exit(0)
})();