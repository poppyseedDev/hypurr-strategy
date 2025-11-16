# HypurrFi Smart Contract Integration Guide

## Overview
HypurrFi is a leveraged lending marketplace on Hyperliquid, implementing an Aave V3-like architecture for lending, borrowing, and liquidations. This guide outlines the key contract interfaces, addresses, and integration patterns required to interact with the protocol.

---

## 1. Pool Contract Interface

The Pool contract (`0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b`) is the primary entry point for all lending protocol interactions.

### Supply Function

**Function Signature:**
```solidity
function supply(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
) external
```

**Parameters:**
- `asset`: ERC20 token address to deposit
- `amount`: Amount of tokens to deposit
- `onBehalfOf`: Address to receive hyTokens (typically msg.sender)
- `referralCode`: Referral code for tracking (typically 0)

**Requirements:**
- Caller must approve the Pool contract to spend the asset beforehand
- Deposited tokens are converted to hyTokens at 1:1 ratio
- Deposits immediately serve as collateral

**Alternative - Permit-Based Supply:**
```solidity
function supplyWithPermit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode,
    uint256 deadline,
    uint8 permitV,
    bytes32 permitR,
    bytes32 permitS
) external
```
Enables supply with integrated EIP-2612 permit approval, eliminating need for separate approval transaction.

---

### Borrow Function

**Function Signature:**
```solidity
function borrow(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    uint16 referralCode,
    address onBehalfOf
) external
```

**Parameters:**
- `asset`: ERC20 token address to borrow
- `amount`: Amount of tokens to borrow
- `interestRateMode`: Interest rate mode (1 = stable, 2 = variable)
- `referralCode`: Referral code for tracking (typically 0)
- `onBehalfOf`: Address to accrue debt (typically msg.sender)

**Requirements:**
- Caller must have sufficient collateral (health factor > 1)
- Debt accrues at specified interest rate
- Interest rates determined by utilization rate: `utilization = totalBorrowed / totalSupplied`

**Interest Rate Mechanics:**
- Rates adjust automatically based on market conditions
- Higher borrowing demand increases rates proportionally
- Stable vs variable rates offer different risk/return profiles

---

### Withdrawal Function

**Function Signature:**
```solidity
function withdraw(
    address asset,
    uint256 amount,
    address to
) external returns (uint256)
```

**Parameters:**
- `asset`: Address of the reserve to withdraw from
- `amount`: Amount to withdraw (use `type(uint).max` for full balance)
- `to`: Address to receive withdrawn tokens

**Requirements:**
- Caller must hold sufficient hyTokens
- Withdrawal must not cause health factor to drop below 1
- hyTokens are burned 1:1 with underlying asset

---

### Repayment Functions

**Standard Repay:**
```solidity
function repay(
    address asset,
    uint256 amount,
    uint256 rateMode,
    address onBehalfOf
) external returns (uint256)
```

**Parameters:**
- `asset`: Address of borrowed asset
- `amount`: Amount to repay (use `uint256(-1)` for full repayment)
- `rateMode`: Interest rate mode of the debt (1 = stable, 2 = variable)
- `onBehalfOf`: Address whose debt is being repaid

**Repay with Permit:**
```solidity
function repayWithPermit(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    address onBehalfOf,
    uint256 deadline,
    uint8 permitV,
    bytes32 permitR,
    bytes32 permitS
) external returns (uint256)
```
Combines repayment with permit-based approval in single transaction.

**Repay with hyTokens:**
```solidity
function repayWithATokens(
    address asset,
    uint256 amount,
    uint256 interestRateMode
) external returns (uint256)
```
Allows repayment using hyToken balances directly without separate approvals.

---

### Account Data Query

**Function Signature:**
```solidity
function getUserAccountData(address user) external view returns (
    uint256 totalCollateralBase,
    uint256 totalDebtBase,
    uint256 availableBorrowsBase,
    uint256 currentLiquidationThreshold,
    uint256 ltv,
    uint256 healthFactor
)
```

**Return Values:**
- `totalCollateralBase`: Total value of collateral (in base currency, typically USD)
- `totalDebtBase`: Total borrowed amount (in base currency)
- `availableBorrowsBase`: Remaining amount that can be borrowed
- `currentLiquidationThreshold`: Weighted average liquidation threshold
- `ltv`: Loan-to-Value ratio (borrow / collateral)
- `healthFactor`: Health factor (collateral * liquidationThreshold / debt)

**Health Factor Formula:**
```
Health Factor = (Total Collateral × Weighted Average Liquidation Threshold) / Total Borrow Value
```

---

### Reserve Data Query

**Function Signature:**
```solidity
function getReserveData(address asset) external view returns (
    Configuration memory configuration,
    uint128 liquidityIndex,
    uint128 currentLiquidityRate,
    uint128 variableBorrowIndex,
    uint128 currentVariableBorrowRate,
    uint128 currentStableBorrowRate,
    uint40 lastUpdateTimestamp,
    address aTokenAddress,
    address stableDebtTokenAddress,
    address variableDebtTokenAddress,
    address interestRateStrategyAddress,
    uint8 id
)
```

**Returns comprehensive reserve state including:**
- Current interest rates (stable and variable)
- Liquidity and borrow indexes for accrual tracking
- Debt token addresses
- Configuration settings

---

### Additional Operations

**Swap Borrow Rate Mode:**
```solidity
function swapBorrowRateMode(address asset, uint256 rateMode) external
```
Toggle between stable and variable borrowing for existing debt.

**Liquidation Call:**
```solidity
function liquidationCall(
    address collateralAsset,
    address debtAsset,
    address user,
    uint256 debtToCover,
    bool receiveAToken
) external returns (uint256)
```

**Flash Loan:**
```solidity
function flashLoan(
    address receiver,
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata modes,
    address onBehalfOf,
    bytes calldata params,
    uint16 referralCode
) external
```

**Set Collateral Status:**
```solidity
function setUserUseReserveAsCollateral(
    address asset,
    bool useAsCollateral
) external
```

---

## 2. Contract Addresses on HyperEVM Mainnet

### Core Market Contracts
| Contract | Address |
|----------|---------|
| Pool | `0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b` |
| PoolAddressesProvider | `0xA73ff12D177D8F1Ec938c3ba0e87D33524dD5594` |
| PoolConfigurator | `0x532Bb57DE005EdFd12E7d39a3e9BF8E8A8F544af` |
| ACLManager | `0x79CBF4832439554885E4bec9457C1427DFB9D0d3` |
| WrappedHypeGateway | `0xd1EF87FeFA83154F83541b68BD09185e15463972` |

### Data Provider Contracts
| Contract | Address | Purpose |
|----------|---------|---------|
| UiPoolDataProvider | `0x7b883191011AEAe40581d3Fa1B112413808C9c00` | UI data aggregation |
| UiIncentiveDataProvider | `0x8ebA6fc4Ff6Ba4F12512DD56d0E4aaC6081f5274` | Incentive data |
| ProtocolDataProvider | `0x895C799a5bbdCb63B80bEE5BD94E7b9138D977d6` | Protocol state data |
| WalletBalanceProvider | `0xE913De89D8c868aEF96D3b10dAAE1900273D7Bb2` | Wallet balances |

### Implementation Contracts
| Contract | Address |
|----------|---------|
| PoolImpl | `0x980BDd9cF1346800F6307E3B2301fFd3ce8C7523` |
| PoolConfiguratorImpl | `0x7F4b3CfB3d60aD390E813bc745a44B9030510056` |
| HyTokenImpl | `0xa3703e1a77A23A92F21cd5565e5955E98a4fAAcC` |
| VariableDebtTokenImpl | `0xdBcF99e5202b2bB9C47182209c7a551524f7c690` |

### Oracle and Treasury
| Contract | Address | Purpose |
|----------|---------|---------|
| HyFiOracle | `0x9BE2ac1ff80950DCeb816842834930887249d9A8` | Price oracle for collateral valuation |
| Treasury | `0xdC6E5b7aA6fCbDECC1Fda2b1E337ED8569730288` | Protocol treasury |
| TreasuryController | `0x9E6eFa77192DA81E22c8791Ba65c5A5E9795E697` | Treasury management |
| DefaultInterestRateStrategy | `0x701B26833A2dFa145B29Ef1264DE3a5240E17bBD` | Interest rate calculation |

---

## 3. Health Factor and Liquidation Mechanics

### Health Factor Overview

The health factor is the primary metric determining liquidation risk:

```
Health Factor = (Total Collateral Value × Liquidation Threshold) / Total Borrow Value
```

**Status Classifications:**
- **HF > 1.0**: Position is safe from liquidation
- **0.95 ≤ HF < 1.0**: Position at moderate risk, partial liquidation possible
- **HF < 0.95**: Position at severe risk, full liquidation possible
- **HF < 1.0**: Position eligible for liquidation

### Liquidation Process

**Close Factor (Liquidation Amount):**
| Health Factor Range | Max Liquidation Amount | Liquidation Penalty |
|-------------------|------------------------|-------------------|
| 0.95 to <1.0 | 50% of outstanding debt | 8% |
| Below 0.95 | 100% of outstanding debt | 8% |

**Liquidation Penalty:**
An 8% penalty is applied to the liquidated portion, serving as:
- Compensation to the liquidator
- Buffer for loan repayment costs
- Protocol incentive for maintaining system health

**Current Liquidation Model:**
- HypurrFi manages liquidations directly
- Protocol may transition to permissionless liquidation through governance
- This would allow any participant to act as liquidator

### Asset-Specific Liquidation Thresholds

| Asset | Liquidation Threshold |
|-------|----------------------|
| HYPE | 60% |
| stHYPE | 60% |
| UBTC | 60% |
| UETH | 40% |

Higher thresholds apply within E-mode for correlated assets (e.g., stablecoins permit increased borrowing capacity).

### Health Factor Monitoring

**Risk Management Strategy:**
1. **Supply Phase**: Deposit assets to earn interest and establish collateral base
2. **Borrow Phase**: Borrow up to health factor limit (user-determined ratio up to 82.5%)
3. **Active Monitoring**: Track health factor against price oracle updates
4. **Risk Mitigation**:
   - Supply additional collateral to improve health factor
   - Repay portion of debt to reduce leverage
   - React to price movements affecting collateral value

**Key Variables Affecting Health Factor:**
- Collateral price (inversely - price decrease worsens health factor)
- Debt amount (inversely - higher debt worsens health factor)
- Interest accrual (compounds risk over time)
- Liquidation thresholds (governance-set per asset)

---

## 4. Oracle and Price Feed Architecture

### Oracle Types

HypurrFi uses three primary oracle mechanisms:

#### 1. Hyperliquid Price Feeds (Primary)
- **Source**: Hyperliquid Validators
- **Characteristics**:
  - Highly reliable, decentralized price data
  - Multiple channel aggregation for manipulation resistance
  - Primary data source for on-chain collateral valuation

#### 2. Redstone and Pyth Feeds (Backup)
- **Source**: Alternative decentralized price feeds
- **Characteristics**:
  - Serve as backup for assets unsupported by Hyperliquid
  - Provides redundancy in price discovery
  - Used when primary feeds unavailable

#### 3. Correlated Assets Price Oracle (CAPO) (Specialized)
- **Purpose**: Derivatives and wrapped token pricing
- **Design**:
  - Designed for assets with strong correlation to underlying asset
  - Examples: Wrapped tokens (wBTC, wETH) tracking underlying
  - Implements specialized adjustment logic for tracking accuracy

### Price Oracle Interface

**HyFiOracle Contract Address:** `0x9BE2ac1ff80950DCeb816842834930887249d9A8`

**Core Functions:**
```solidity
// Get latest price for an asset
function getLatestPrice(address asset) external view returns (uint256);

// Get price with timestamp to verify freshness
function getPriceData(address asset) external view returns (
    uint256 price,
    uint256 timestamp
);
```

### Oracle Update Frequency

Oracle contracts submit price updates according to operational parameters:
- **Time-Based Updates**: Periodic submissions at fixed intervals
- **Deviation-Triggered Updates**: When price moves beyond threshold
- **Event-Based Updates**: In response to significant market events

### Security Considerations

1. **Price Freshness**: Always verify timestamp of oracle data
2. **Multi-Source Validation**: Cross-check prices from multiple oracles when possible
3. **Stale Price Protection**: Implement maximum acceptable price age in contracts
4. **Manipulation Resistance**: Hyperliquid aggregation reduces single-source attack risk
5. **Fallback Mechanisms**: Prepare handling for oracle failures or anomalies

### Implementation Pattern

```solidity
// Example: Querying user health factor based on current prices
function getHealthFactorWithCurrentPrices(address user) external view returns (uint256) {
    (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        ,
        uint256 currentLiquidationThreshold,
        ,
        uint256 healthFactor
    ) = pool.getUserAccountData(user);

    // Health factor already computed with current oracle prices
    return healthFactor;
}
```

---

## 5. Integration Patterns and Code Examples

### Pattern 1: Supply and Earn

```solidity
pragma solidity ^0.8.0;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );
}

contract SupplyExample {
    address constant POOL = 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b;

    function supplyAsset(address asset, uint256 amount) external {
        // Step 1: Approve Pool to spend asset
        IERC20(asset).approve(POOL, amount);

        // Step 2: Supply to pool
        IPool(POOL).supply(asset, amount, msg.sender, 0);
    }
}
```

### Pattern 2: Borrow with Health Factor Check

```solidity
contract BorrowExample {
    address constant POOL = 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b;

    function borrowWithHealthCheck(
        address asset,
        uint256 amount,
        uint256 minHealthFactor
    ) external {
        // Get current position
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactorBefore
        ) = IPool(POOL).getUserAccountData(msg.sender);

        // Verify sufficient collateral exists
        require(availableBorrowsBase >= amount, "Insufficient collateral");

        // Borrow with variable interest rate
        IPool(POOL).borrow(asset, amount, 2, 0, msg.sender);

        // Verify health factor remains above minimum threshold
        (, , , , , uint256 healthFactorAfter) = IPool(POOL).getUserAccountData(msg.sender);
        require(healthFactorAfter >= minHealthFactor, "Health factor too low");
    }
}
```

### Pattern 3: Lever Borrowing (Borrow stablecoins, use for leverage)

```solidity
contract LeverageExample {
    address constant POOL = 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b;
    address constant USDC = 0x...; // USDC address on HyperEVM
    address constant HYPE = 0x...; // HYPE address on HyperEVM

    function openLeveredPosition(
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external {
        // Step 1: Supply HYPE as collateral
        IERC20(HYPE).approve(POOL, collateralAmount);
        IPool(POOL).supply(HYPE, collateralAmount, msg.sender, 0);

        // Step 2: Borrow stablecoins against collateral
        IPool(POOL).borrow(USDC, borrowAmount, 2, 0, msg.sender);

        // Step 3: Verify position health
        (, , , , , uint256 healthFactor) = IPool(POOL).getUserAccountData(msg.sender);
        require(healthFactor > 1.1, "Position not safe"); // 10% safety margin
    }
}
```

### Pattern 4: Flash Loan

```solidity
interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bytes32);
}

contract FlashLoanExample is IFlashLoanReceiver {
    address constant POOL = 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b;

    function requestFlashLoan(address asset, uint256 amount) external {
        address[] memory assets = new address[](1);
        assets[0] = asset;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        uint256[] memory modes = new uint256[](1);
        modes[0] = 0; // 0 = no debt opening

        IPool(POOL).flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            msg.sender,
            bytes(""),
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bytes32) {
        // Execute arbitrage or other flash loan strategy

        // Must repay: borrowed amount + premium
        uint256 amountOwed = amount + premium;
        IERC20(asset).approve(POOL, amountOwed);

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}
```

### Pattern 5: Liquidation Call

```solidity
contract LiquidationExample {
    address constant POOL = 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b;

    function liquidatePosition(
        address collateralAsset,
        address debtAsset,
        address userToLiquidate,
        uint256 debtToCover
    ) external returns (uint256) {
        // Approve pool to spend debt asset for repayment
        IERC20(debtAsset).approve(POOL, debtToCover);

        // Execute liquidation (can receive aToken or underlying)
        uint256 collateralReceived = IPool(POOL).liquidationCall(
            collateralAsset,
            debtAsset,
            userToLiquidate,
            debtToCover,
            false // false = receive underlying asset, true = receive hyToken
        );

        return collateralReceived;
    }
}
```

---

## 6. Security Considerations

### General Best Practices

1. **Health Factor Monitoring**
   - Continuously monitor health factor in automated systems
   - Implement alerts when HF approaches 1.0
   - Maintain safety margins (e.g., min HF of 1.2)

2. **Price Oracle Validation**
   - Verify oracle price freshness before using
   - Implement maximum acceptable price age (e.g., 1 hour)
   - Use multiple oracle sources for critical operations
   - Monitor for price anomalies and spikes

3. **Approval Management**
   - Always approve exact amounts needed
   - Consider using permit-based functions to reduce approval transactions
   - Revoke approvals after large operations if possible

4. **Flash Loan Reentrancy**
   - When using flash loans, implement proper reentrancy guards
   - Verify msg.sender is the Pool contract in callbacks
   - Ensure all state changes are committed before external calls

5. **Interest Rate Timing**
   - Account for interest accrual in debt calculations
   - Recompute health factor after any borrow or supply operation
   - Use `uint256(-1)` for repayment amount only when repaying all debt

### Liquidation Risk Management

1. **Position Sizing**
   - Maintain health factor above 1.2 for normal operations
   - Use max 82.5% borrow ratio as upper limit
   - Reduce leverage during high volatility periods

2. **Collateral Diversification**
   - Diversify collateral across multiple assets
   - Understand liquidation thresholds for each collateral type
   - Avoid over-concentration in volatile assets

3. **Debt Management**
   - Monitor interest accrual over time
   - Repay debt proactively before reaching liquidation threshold
   - Use `swapBorrowRateMode` strategically (stable for certainty, variable for lower rates)

4. **Emergency Procedures**
   - Always have withdrawal capacity for at least partial debt repayment
   - Monitor gas prices for emergency repayments
   - Have contingency plans for oracle failures

### Smart Contract Audit Checklist

- [ ] All external calls properly handle return values
- [ ] Proper error handling for failed transactions
- [ ] Events emitted for all state changes
- [ ] Reentrancy protection where needed
- [ ] Overflow/underflow protection (use SafeMath or Solidity 0.8+)
- [ ] Proper access control and authorization
- [ ] Slippage protection on swaps
- [ ] Time-lock for critical operations (if applicable)

---

## 7. Integration Checklist

### Pre-Integration
- [ ] Review Pool contract ABI on block explorer or GitHub
- [ ] Verify contract addresses on HyperEVM mainnet
- [ ] Test in testnet environment first
- [ ] Set up oracle price feed monitoring
- [ ] Implement health factor monitoring system

### Integration Steps
1. [ ] Implement ERC20 approvals for assets
2. [ ] Set up supply/borrow orchestration logic
3. [ ] Implement getUserAccountData queries
4. [ ] Create health factor monitoring service
5. [ ] Build liquidation detection system
6. [ ] Implement repayment automation
7. [ ] Add emergency withdrawal mechanisms
8. [ ] Test with various market conditions (high volatility, etc.)
9. [ ] Audit smart contracts if holding user funds
10. [ ] Deploy to testnet, stress test, deploy to mainnet

### Monitoring and Operations
- [ ] Monitor health factors across positions
- [ ] Track interest rate changes
- [ ] Monitor oracle price feeds for anomalies
- [ ] Set up alerts for liquidation risk
- [ ] Regular rebalancing of positions
- [ ] Governance participation (if applicable)

---

## 8. References and Additional Resources

### Key Contracts
- **Pool**: Primary interface for all lending operations
- **HyFiOracle**: Price feed provider for collateral valuation
- **ProtocolDataProvider**: Query-only contract for protocol state

### Important Addresses
- **PoolAddressesProvider**: `0xA73ff12D177D8F1Ec938c3ba0e87D33524dD5594`
  - Central registry for all protocol addresses
  - Use for verifying contract addresses on-chain

### Concepts
- **Health Factor**: Key metric for liquidation risk (must stay > 1.0)
- **Liquidation Threshold**: Asset-specific parameter (40-60% for HypurrFi)
- **LTV Ratio**: Loan-to-value, inverse of health factor
- **Interest Accrual**: Automatic, based on utilization rates
- **E-mode**: Enhanced mode for correlated assets (higher LTV)

---

## Summary

The HypurrFi protocol provides a robust, Aave V3-like lending platform on HyperEVM with:

1. **Core Operations**: Supply → Borrow → Monitor Health → Repay/Liquidate
2. **Health Factor Monitoring**: Critical for risk management (formula: collateral * threshold / debt)
3. **Multi-Tier Oracle System**: Hyperliquid primary + Redstone/Pyth backup + CAPO for derivatives
4. **Flexible Interest Rates**: Dynamic stable and variable borrowing options
5. **Comprehensive Risk Management**: Liquidation penalties, close factors, and thresholds

For safe integration, maintain health factors above 1.2, monitor oracle feeds closely, and implement proper rebalancing mechanisms.
