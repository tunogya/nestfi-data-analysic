import AsyncBlock from "./asyncBlock.js";

(async () => {
  const scroll = new AsyncBlock(534353);
  
  while (true) {
    await scroll.run()
    console.log('scroll executed finally:' + new Date());
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
  }
})();