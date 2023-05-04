SET SQL_MODE='ALLOW_INVALID_DATES';

-- 创建一个F_FUTURE_TRADING表，继承BaseTable，用于存储交易记录
DROP TABLE IF EXISTS F_FUTURE_TRADING CASCADE;
CREATE TABLE IF NOT EXISTS F_FUTURE_TRADING
(
    _id             serial      NOT NULL PRIMARY KEY,
    _createTime     timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updateTime     timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blockNumber     integer     NOT NULL,
    timeStamp       timestamp   NOT NULL,
    hash            varchar(66) NOT NULL,
    gasFee          numeric     NOT NULL,
    product         varchar(20),
    chainId         integer     NOT NULL,
    positionIndex   integer,
    currency        varchar(20),
    leverage        integer,
    orderPrice      numeric,
    orderType       varchar(40) NOT NULL,
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
);

DROP TABLE IF EXISTS F_FUTURE_PRICE CASCADE;
CREATE TABLE IF NOT EXISTS F_FUTURE_PRICE
(
    _id           serial      NOT NULL PRIMARY KEY,
    _createTime   timestamp DEFAULT CURRENT_TIMESTAMP,
    _updateTime   timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blockNumber   integer     NOT NULL,
    hash          varchar(66) NOT NULL,
    timeStamp     timestamp   NOT NULL,
    gasFee        numeric     NOT NULL,
    walletAddress varchar(42) NOT NULL,
    chainId       integer     NOT NULL,
    ethPrice      numeric     NOT NULL,
    btcPrice      numeric     NOT NULL,
    bnbPrice      numeric     NOT NULL,
    status        boolean     NOT NULL,
    positionIndices json,
    UNIQUE (hash, chainId)
)