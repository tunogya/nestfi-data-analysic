-- 如果没有启动，需要先启动
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区为上海
SET TIME ZONE 'Asia/Shanghai';

-- 创建一个基础表，定义全局的流水号和创建、更新时间
DROP TABLE IF EXISTS BaseTable CASCADE;
CREATE table IF NOT EXISTS BaseTable
(
    _id         uuid      NOT NULL DEFAULT uuid_generate_v4(),
    _createTime timestamp NOT NULL DEFAULT now(),
    _updateTime timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (_id)
);

-- 创建一个触发器函数，用于更新更新时间
CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW._updateTime = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建一个触发器，用于更新更新时间
CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON BaseTable
    FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- 创建一个F_FUTURE_TRADING表，继承BaseTable，用于存储交易记录
DROP TABLE IF EXISTS F_FUTURE_TRADING CASCADE;
CREATE TABLE IF NOT EXISTS F_FUTURE_TRADING
(
    blockNumber     integer     NOT NULL,
    timeStamp       timestamp   NOT NULL,
    hash            varchar(66) NOT NULL,
    gasFee          numeric     NOT NULL,
    product         varchar,
    chainId         integer     NOT NULL,
    positionIndex   integer,
    currency        varchar,
    leverage        integer,
    orderPrice      numeric,
    orderType       varchar     NOT NULL,
    direction       boolean,
    margin          numeric,
    volume          numeric,
    stopLossPrice   numeric,
    takeProfitPrice numeric,
    fees            numeric,
    executionFees   numeric,
    walletAddress   varchar(42) NOT NULL,
    status          boolean     NOT NULL,
    UNIQUE (hash, orderType)
) INHERITS (BaseTable);

CREATE INDEX IF NOT EXISTS f_future_trading_hash_index
    on F_FUTURE_TRADING (hash);

CREATE INDEX IF NOT EXISTS f_future_trading_ordertype_index
    on F_FUTURE_TRADING (ordertype);

DROP TABLE IF EXISTS F_FUTURE_PRICE CASCADE;
CREATE TABLE IF NOT EXISTS F_FUTURE_PRICE
(
    blockNumber     integer     NOT NULL,
    hash            varchar(66) NOT NULL,
    timeStamp       timestamp   NOT NULL,
    gasFee          numeric     NOT NULL,
    walletAddress   varchar(42) NOT NULL,
    chainId         integer     NOT NULL,
    ethPrice        numeric     NOT NULL,
    btcPrice        numeric     NOT NULL,
    bnbPrice        numeric     NOT NULL,
    status          boolean     NOT NULL,
    positionIndices integer[],
    UNIQUE (hash, chainId)
) INHERITS (BaseTable);

CREATE INDEX IF NOT EXISTS f_future_price_hash_index
    on F_FUTURE_PRICE (hash);

-- 创建一个KOL清算表，用于存储清算记录
DROP TABLE IF EXISTS F_CLEARING_KOL CASCADE;
CREATE TABLE IF NOT EXISTS F_CLEARING_KOL
(
    date                  date        NOT NULL,
    walletAddress         varchar(42) NOT NULL,
    chainId               integer     NOT NULL,
    tradingVolume         numeric,
    fees                  numeric     NOT NULL,
    dailyActiveUsers      integer,
    dailyUserTransactions integer,
    dailyDestruction      numeric,
    UNIQUE (date, walletAddress, chainId)
) INHERITS (BaseTable);

-- 创建一个KOL结算表，用于存储结算记录
DROP TABLE IF EXISTS B_SETTLEMENT_REBATE CASCADE;
CREATE TABLE IF NOT EXISTS B_SETTLEMENT_REBATE
(
    settlementDate     date        NOT NULL,
    paymentTime        timestamp,
    walletAddress      varchar(42) NOT NULL,
    tgName             varchar,
    chainId            integer     NOT NULL,
    ratio              numeric     NOT NULL,
    hasActiveCampaign  boolean     NOT NULL,
    hasBlacklist       boolean     NOT NULL,
    settlementAmount   numeric     NOT NULL,
    settlementCurrency varchar     NOT NULL,
    hash               varchar(66),
    status             boolean,
    UNIQUE (settlementDate, walletAddress, chainId)
) INHERITS (BaseTable);

DROP TABLE IF EXISTS B_SETTLEMENT_LEVEL2 CASCADE;
CREATE TABLE IF NOT EXISTS B_SETTLEMENT_LEVEL2
(
    settlementDate     date        NOT NULL,
    paymentTime        timestamp,
    walletAddress      varchar(42) NOT NULL,
    tgName             varchar,
    chainId            integer     NOT NULL,
    ratio              numeric     NOT NULL,
    hasActiveCampaign  boolean     NOT NULL,
    hasBlacklist       boolean     NOT NULL,
    settlementAmount   numeric     NOT NULL,
    settlementCurrency varchar     NOT NULL,
    hash               varchar(66),
    status             boolean,
    UNIQUE (settlementDate, walletAddress, chainId)
) INHERITS (BaseTable);

-- 创建一个USER表，用于存储用户信息
DROP TABLE IF EXISTS F_USER_INFO CASCADE;
CREATE TABLE IF NOT EXISTS F_USER_INFO
(
    walletAddress varchar(42) NOT NULL,
    tgName        varchar,
    chatId        varchar,
    UNIQUE (walletAddress)
) INHERITS (BaseTable);

-- 创建walletAddress索引
CREATE INDEX IF NOT EXISTS f_user_info_walletaddress_index
    on F_USER_INFO (walletAddress);

-- 创建一个KOL表，用于存储KOL信息
DROP TABLE IF EXISTS F_KOL_INFO CASCADE;
CREATE TABLE IF NOT EXISTS F_KOL_INFO
(
    walletAddress varchar(42) NOT NULL,
    tgName        varchar,
    chatId        varchar,
    radio         numeric     NOT NULL DEFAULT 1,
    UNIQUE (walletAddress)
) INHERITS (BaseTable);

-- 创建walletAddress索引
CREATE INDEX IF NOT EXISTS f_kol_info_walletaddress_index
    on F_KOL_INFO (walletAddress);

-- 创建一个USER黑名单表，用于存储用户黑名单信息
DROP TABLE IF EXISTS F_USER_BLACKLIST CASCADE;
CREATE TABLE IF NOT EXISTS F_USER_BLACKLIST
(
    walletAddress varchar(42) NOT NULL,
    tgName        varchar,
    type          varchar,
    notes         varchar,
    UNIQUE (walletAddress)
) INHERITS (BaseTable);

-- 创建一个KOL黑名单表，用于存储KOL黑名单信息
DROP TABLE IF EXISTS F_KOL_BLACKLIST CASCADE;
CREATE TABLE IF NOT EXISTS F_KOL_BLACKLIST
(
    walletAddress            varchar(42) NOT NULL,
    tgName                   varchar,
    type                     varchar,
    revokeInvitationRelation boolean,
    notes                    varchar,
    UNIQUE (walletAddress)
) INHERITS (BaseTable);

-- 创建一个USER关系表，用于存储用户的邀请关系信息
DROP TABLE IF EXISTS F_USER_RELATIONSHIP CASCADE;
CREATE TABLE IF NOT EXISTS F_USER_RELATIONSHIP
(
    inviterCode          varchar(8),
    inviterWalletAddress varchar(42),
    inviteeWalletAddress varchar(42),
    inviterTgName        varchar,
    inviteeTgName        varchar,
    relationshipLevel    integer NOT NULL DEFAULT 1,
    invitationMethod     varchar,
    rewardType           varchar,
    status               varchar DEFAULT 'invited',
    invitationDate       timestamp,
    uninvitedTime        timestamp,
    UNIQUE (inviterWalletAddress, inviteeWalletAddress)
) INHERITS (BaseTable);
