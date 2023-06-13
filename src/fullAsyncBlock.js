import dotenv from 'dotenv';
import {FullAsyncBlock} from "./asyncBlock.js";
import Clearing from "./clearing.js";
import Settlement from "./settlement.js";

dotenv.config();

(async () => {
  const bsc = new FullAsyncBlock(56);
  const scroll = new FullAsyncBlock(534353);
  
  await bsc.run()
  console.log('bsc executed finally:' + new Date());
  await scroll.run()
  console.log('scroll executed finally:' + new Date());
  
  const bscClearing = new Clearing(56);
  await bscClearing.handleHistory();
  console.log('bscClearing executed finally:' + new Date());
  
  const bscSettlement = new Settlement(56);
  await bscSettlement.handleHistory();
  console.log('bscSettlement executed finally:' + new Date());
})();