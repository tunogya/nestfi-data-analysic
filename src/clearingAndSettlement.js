import dotenv from 'dotenv';
import Clearing from "./clearing.js";
import Settlement from "./settlement.js";

dotenv.config();

(async () => {
  const bscClearing = new Clearing(56);
  await bscClearing.handleHistory();
  console.log('bscClearing executed finally:' + new Date());
  
  const bscSettlement = new Settlement(56);
  await bscSettlement.handleHistory();
  console.log('bscSettlement executed finally:' + new Date());
})();