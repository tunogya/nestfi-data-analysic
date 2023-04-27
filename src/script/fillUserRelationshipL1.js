// 遍历所有的f_user_relationship
import sql from "../lib/db.js";

const main = async () => {
  const users = await sql`
      SELECT *
      FROM f_user_relationship
  `
  for (let i = 0; i < users.length; i++) {
    const code = users[i].invitercode.toLowerCase();
    const _id = users[i]._id;
    // 从f_user_info中获取邀请人的信息，邀请人的地址的末8位是邀请码
    
    try {
      // 根据code查询L1邀请人的信息
      const inviterL1 = await sql`
          SELECT *
          FROM f_user_info
          WHERE lower(walletaddress) LIKE ${'%' + code}
      `
      if (inviterL1.length === 0) continue;
      const inviterwalletaddressL1 = inviterL1[0].walletaddress;
      const invitertgnameL1 = inviterL1[0].tgname;
      // 补全L1邀请人的信息
      // 更新f_user_relationship中的邀请人的inviterwalletaddress和invitertgname
      await sql`
          UPDATE f_user_relationship
          SET inviterwalletaddress = ${inviterwalletaddressL1},
              invitertgname        = ${invitertgnameL1}
          WHERE _id = ${_id}
      `
      console.log('update success', _id)
    } catch (e) {
      console.log(e)
    }
  }
}

main().finally(() => process.exit(0))