import sql from "../lib/db.js";

// inviterwalletaddress， 邀请人的地址
// invitertgname， 邀请人的tg名字

// inviteewalletaddress， 被邀请人的地址
// inviteetgname， 被邀请人的tg名字

// relationshiplevel, 关系层数

const main = async () => {
  // 遍历所有的1层关系，新建2层关系的记录
  const users = await sql`
      SELECT *
      FROM f_user_relationship
      WHERE relationshiplevel = 1
  `
  for (let i = 0; i < users.length; i++) {
    // 定义 A邀请B，B邀请C
    // 每条记录目前是B邀请C，需要新建A邀请C的记录
    const addressB = users[i].inviterwalletaddress;
    const addressC = users[i].inviteewalletaddress;
    const tgnameC = users[i].inviteetgname;
    const relationshipBC = users[i].relationshiplevel;
    
    // 根据inviterwalletaddressL1查询L2邀请人的信息
    const inviterL2 = await sql`
        SELECT *
        FROM f_user_relationship
        WHERE inviteewalletaddress = ${addressB}
    `
    if (inviterL2.length === 0) continue;
    const addressA = inviterL2[0].inviterwalletaddress;
    const tgnameA = inviterL2[0].invitertgname;
    
    // 补全A邀请C的二层信息
    await sql`
        INSERT INTO f_user_relationship
        (inviterwalletaddress, invitertgname, inviteewalletaddress, inviteetgname, relationshiplevel)
        VALUES (${addressA}, ${tgnameA}, ${addressC}, ${tgnameC},
                ${relationshipBC + 1})
        ON CONFLICT (inviterwalletaddress, inviteewalletaddress) DO NOTHING;
    `
    console.log('insert success', addressA, addressC)
  }
}

main().finally(() => process.exit(0))