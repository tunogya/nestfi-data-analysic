SET SQL_MODE = 'ALLOW_INVALID_DATES';

-- 创建一个F_FUTURE_TRADING表，继承BaseTable，用于存储交易记录
DROP TABLE IF EXISTS f_future_trading CASCADE;
CREATE TABLE IF NOT EXISTS f_future_trading
(
    _id             serial         NOT NULL PRIMARY KEY,
    _createTime     timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updateTime     timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blockNumber     integer        NOT NULL,
    timeStamp       timestamp      NOT NULL,
    hash            varchar(66)    NOT NULL,
    gasFee          float NOT NULL,
    product         varchar(20),
    chainId         integer        NOT NULL,
    positionIndex   integer,
    currency        varchar(20),
    leverage        integer,
    orderPrice      float,
    orderType       varchar(40)    NOT NULL,
    direction       boolean,
    margin          float,
    volume          float,
    stopLossPrice   float,
    takeProfitPrice float,
    fees            float,
    executionFees   float,
    walletAddress   varchar(42)    NOT NULL,
    status          boolean        NOT NULL,
    clearingStatus  boolean                 DEFAULT FALSE,
    UNIQUE (hash, orderType)
);

DROP TABLE IF EXISTS f_future_price CASCADE;
CREATE TABLE IF NOT EXISTS f_future_price
(
    _id           serial      NOT NULL PRIMARY KEY,
    _createTime   timestamp DEFAULT CURRENT_TIMESTAMP,
    _updateTime   timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blockNumber   integer     NOT NULL,
    hash          varchar(66) NOT NULL,
    timeStamp     timestamp   NOT NULL,
    gasFee        float     NOT NULL,
    walletAddress varchar(42) NOT NULL,
    chainId       integer     NOT NULL,
    ethPrice      float     NOT NULL,
    btcPrice      float     NOT NULL,
    bnbPrice      float     NOT NULL,
    status        boolean     NOT NULL,
    UNIQUE (hash, chainId)
);

DROP TABLE IF EXISTS b_clearing_kol CASCADE;
CREATE TABLE IF NOT EXISTS b_clearing_kol
(
    _id                   serial      NOT NULL PRIMARY KEY,
    _createTime           timestamp DEFAULT CURRENT_TIMESTAMP,
    _updateTime           timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date                  date        NOT NULL,
    walletAddress         varchar(42) NOT NULL,
    relationshipLevel     integer     NOT NULL,
    ratio                 float     NOT NULL,
    chainId               integer     NOT NULL,
    tradingVolume         float,
    fees                  float,
    dailyActiveUsers      integer,
    dailyUserTransactions integer,
    dailyDestruction      float
);

DROP TABLE IF EXISTS B_SETTLEMENT CASCADE;
CREATE TABLE IF NOT EXISTS B_SETTLEMENT
(
    _id                serial      NOT NULL PRIMARY KEY,
    _createTime        timestamp DEFAULT CURRENT_TIMESTAMP,
    _updateTime        timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date               date        NOT NULL,
    walletAddress      varchar(42) NOT NULL,
    chainId            integer     NOT NULL,
    settlementAmount   float     NOT NULL,
    settlementCurrency varchar(20) NOT NULL,
    type               varchar(20),
    hash               varchar(66),
    status             boolean,
    UNIQUE (date, walletAddress, chainId, type)
)