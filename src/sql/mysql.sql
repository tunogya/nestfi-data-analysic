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
    gasFee          decimal(18, 6) NOT NULL,
    product         varchar(20),
    chainId         integer        NOT NULL,
    positionIndex   integer,
    currency        varchar(20),
    leverage        integer,
    orderPrice      decimal(18, 6),
    orderType       varchar(40)    NOT NULL,
    direction       boolean,
    margin          decimal(18, 6),
    volume          decimal(18, 6),
    stopLossPrice   decimal(18, 6),
    takeProfitPrice decimal(18, 6),
    fees            decimal(18, 2),
    executionFees   decimal(18, 6),
    sellValue       decimal(18, 6),
    walletAddress   varchar(42)    NOT NULL,
    status          boolean        NOT NULL,
    clearingStatus  boolean                 DEFAULT FALSE,
    UNIQUE (hash, orderType, positionIndex)
);

DROP TABLE IF EXISTS f_future_price CASCADE;
CREATE TABLE IF NOT EXISTS f_future_price
(
    _id           serial         NOT NULL PRIMARY KEY,
    _createTime   timestamp DEFAULT CURRENT_TIMESTAMP,
    _updateTime   timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blockNumber   integer        NOT NULL,
    hash          varchar(66)    NOT NULL,
    timeStamp     timestamp      NOT NULL,
    gasFee        decimal(12, 6) NOT NULL,
    walletAddress varchar(42)    NOT NULL,
    chainId       integer        NOT NULL,
    ethPrice      decimal(16, 6) NOT NULL,
    btcPrice      decimal(16, 6) NOT NULL,
    bnbPrice      decimal(16, 6) NOT NULL,
    maticPrice    decimal(16, 6) NOT NULL,
    adaPrice      decimal(16, 6) NOT NULL,
    dogePrice     decimal(16, 6) NOT NULL,
    xrpPrice      decimal(16, 6) NOT NULL,
    status        boolean        NOT NULL,
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
    chainId               integer     NOT NULL,
    tradingVolume         decimal(18, 6),
    fees                  decimal(18, 6),
    reward                decimal(18, 6),
    dailyActiveUsers      integer,
    dailyUserTransactions integer,
    dailyDestruction      decimal(18, 6),
    status                boolean     NOT NULL,
    settlementStatus      boolean   DEFAULT FALSE
);

DROP TABLE IF EXISTS B_SETTLEMENT CASCADE;
CREATE TABLE IF NOT EXISTS B_SETTLEMENT
(
    _id                serial         NOT NULL PRIMARY KEY,
    _createTime        timestamp DEFAULT CURRENT_TIMESTAMP,
    _updateTime        timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date               date           NOT NULL,
    walletAddress      varchar(42)    NOT NULL,
    chainId            integer        NOT NULL,
    settlementAmount   decimal(18, 6) NOT NULL,
    settlementCurrency varchar(20)    NOT NULL,
    type               varchar(20),
    hash               varchar(66),
    status             boolean
--     UNIQUE (date, walletAddress, chainId, type)
);

-- 创建工资表
DROP TABLE IF EXISTS f_wages CASCADE;
CREATE TABLE IF NOT EXISTS f_wages
(
    _id                serial         NOT NULL PRIMARY KEY,
    _createTime        timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updateTime        timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    startTime          timestamp      NOT NULL,
    endTime            timestamp      NOT NULL,
    walletAddress      varchar(42)    NOT NULL,
    owner              varchar(20),
    type               varchar(20),
    settlementAmount   decimal(18, 6) NOT NULL,
    settlementCurrency varchar(20)    NOT NULL,
    remark             varchar(200),
    hash               varchar(66),
    status             boolean
);

-- 推广费用表
DROP TABLE IF EXISTS f_market CASCADE;
CREATE TABLE IF NOT EXISTS f_market
(
    _id                serial         NOT NULL PRIMARY KEY,
    _createTime        timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    _updateTime        timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    walletAddress      varchar(42)    NOT NULL,
    owner              varchar(20),
    type               varchar(20),
    settlementAmount   decimal(18, 6) NOT NULL,
    settlementCurrency varchar(20)    NOT NULL,
    remark             varchar(200),
    hash               varchar(66),
    status             boolean
);