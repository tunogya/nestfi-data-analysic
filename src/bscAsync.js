import AsyncBlock from "./asyncBlock.js";

(async () => {
  const bsc = new AsyncBlock(56);
  
  while (true) {
    await bsc.run()
    console.log('bsc executed finally:' + new Date());
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
  }
})();