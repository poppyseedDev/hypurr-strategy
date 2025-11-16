# HypurrFi Leverage Loop Vault - Design Document

**Status:** Design Phase
**Last Updated:** 2025-11-15
**Target Standard:** ERC-4626 Tokenized Vault Standard
**Network:** HyperEVM (Mainnet & Testnet)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [ERC-4626 Standard Compliance](#erc-4626-standard-compliance)
4. [Core Contract Functions](#core-contract-functions)
5. [State Variables & Configuration](#state-variables--configuration)
6. [Leverage Loop Mechanics](#leverage-loop-mechanics)
7. [Risk Management & Health Monitoring](#risk-management--health-monitoring)
8. [Pseudo-Code Implementation](#pseudo-code-implementation)
9. [Security Considerations](#security-considerations)
10. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

The **HypurrFi Leverage Loop Vault** is an ERC-4626 compliant smart contract that abstracts complex leverage lending loop operations into a simple "one-click" deposit interface. Users deposit a single asset (USDC, USDXL, HYPE, or stHYPE) and the vault automatically:

1. **Supplies** the asset as collateral to HypurrFi's Pool
2. **Executes recursive loops** (supply → borrow → re-supply) up to a target leverage
3. **Tracks shares** proportionally to user deposits and vault performance
4. **Monitors health factors** continuously, triggering rebalancing when thresholds are breached
5. **Allows users to withdraw** their share of underlying assets, unwinding the loop safely

**Key Innovation:** Combines ERC-4626's standardized vault interface with HypurrFi's lending primitives to provide institutional-grade leverage automation with retail-friendly UX.

---

## Architecture Overview

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│          User Interface / Frontend                           │
│  (Web3 wallet connection, deposit/withdraw/rebalance UX)    │
└────────────────┬────────────────────────────────────────────┘
                 │
┌─────────────────▼────────────────────────────────────────────┐
│    HypurrFi Leverage Loop Vault (ERC-4626)                  │
│                                                               │
│  Core Functions:                                              │
│  • deposit(asset, amount) → shares                           │
│  • mint(shares) → asset amount required                      │
│  • withdraw(shares) → assets to caller                       │
│  • redeem(shares) → assets to caller                         │
│  • rebalance() → adjusts leverage to target HF              │
│  • deleverage() → reduce risk when HF < minimum             │
│                                                               │
│  Internal State:                                              │
│  • shares balance per user (ERC-20)                          │
│  • total vault collateral & debt tracking                    │
│  • target leverage & health factor parameters                │
└────────────────┬────────────────────────────────────────────┘
                 │
┌─────────────────▼────────────────────────────────────────────┐
│         HypurrFi Pool Smart Contracts                        │
│                                                               │
│  • supply(asset, amount, onBehalfOf)                        │
│  • borrow(asset, amount, rateMode, onBehalfOf)             │
│  • repay(asset, amount, rateMode, onBehalfOf)              │
│  • withdraw(asset, amount, to)                              │
│  • getUserAccountData(user) → [collateral, debt, HF, ...]  │
│                                                               │
│  Assets:                                                      │
│  • USDC (6 decimals) - primary collateral & borrow asset    │
│  • USDXL (18 decimals) - hybrid-backed synthetic USD        │
│  • USDT0 (6 decimals) - alternative stablecoin              │
│  • HYPE (18 decimals) - protocol native token               │
│  • stHYPE (18 decimals) - staked HYPE derivative            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Deposit → Loop → Position

```
User deposits 100 USDC
        ↓
Vault receives 100 USDC
        ↓
Mint shares = 100 USDC / exchangeRate
        ↓
Supply 100 USDC to HypurrFi Pool
        ↓
Execute Leverage Loop (4 iterations):
  Iteration 1: Borrow 60 USDXL → Supply 60 USDXL
  Iteration 2: Borrow 36 USDXL → Supply 36 USDXL
  Iteration 3: Borrow 21.6 USDXL → Supply 21.6 USDXL
  Iteration 4: Borrow 12.96 USDXL → Supply 12.96 USDXL
        ↓
Final Position:
  Total Collateral: ~230 (USDC + USDXL)
  Total Debt: ~130 USDXL
  Health Factor: ~1.3
  Leverage: ~2.3x
        ↓
User receives share certificate (ERC-20 token)
```

---

## ERC-4626 Standard Compliance

### Standard Reference
- **Official Spec:** https://eips.ethereum.org/EIPS/eip-4626
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/contracts/5.x/erc4626

### Required Interfaces

```solidity
interface IERC4626 is IERC20 {
    // Events
    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);

    // Asset management
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);

    // Deposit operations
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function mint(uint256 shares, address receiver) external returns (uint256 assets);
    function previewDeposit(uint256 assets) external view returns (uint256);
    function previewMint(uint256 shares) external view returns (uint256);
    function maxDeposit(address receiver) external view returns (uint256);
    function maxMint(address receiver) external view returns (uint256);

    // Withdrawal operations
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function previewWithdraw(uint256 assets) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function maxWithdraw(address owner) external view returns (uint256);
    function maxRedeem(address owner) external view returns (uint256);
}
```

### Leverage Vault Adaptations

**Standard Compliance Notes:**

1. **Total Assets** = Value of all user collateral in the vault (not debt)
   - Calculated as: Collateral Value (via oracle) - Accrued Debt
   - Users' shares represent claims on this net value

2. **Exchange Rate Rounding**
   - `convertToShares()` rounds DOWN (favors vault)
   - `convertToAssets()` rounds DOWN (favors vault)
   - Preview functions must match actual execution

3. **Asset Definition**
   - Primary asset: USDC (or user's choice at init)
   - Secondary assets can be supplied/borrowed, but accounting is in primary asset terms
   - All conversions use HypurrFi's oracle price feeds

4. **Fee Compliance**
   - Fees can be taken at deposit or withdrawal
   - Preview functions must account for fees
   - Recommend transparent fee tier disclosure

---

## Core Contract Functions

### 1. Deposit & Mint (Supply Side)

```
Function: deposit(uint256 assets, address receiver)
Purpose: Accept assets, mint vault shares, execute leverage loop
Parameters:
  - assets: Amount of primary asset (USDC) to deposit
  - receiver: Address to receive vault shares
Returns: shares (amount of vault shares minted)

Flow:
  1. Transfer 'assets' from caller to vault
  2. Calculate shares = convertToShares(assets)
  3. Mint shares to receiver
  4. Execute leverage loop on new deposit
  5. Update collateral/debt tracking
  6. Emit Deposit(caller, receiver, assets, shares)

Requirements:
  - assets > 0
  - Health factor after loop must be >= minHealthFactor
  - Caller must have approved vault to spend assets
```

```
Function: mint(uint256 shares, address receiver)
Purpose: Inverse of deposit - user specifies shares instead of assets
Parameters:
  - shares: Exact number of vault shares to mint
  - receiver: Address to receive shares
Returns: assets (amount of underlying asset required)

Flow:
  1. Calculate assets = convertToAssets(shares)
  2. Transfer assets from caller to vault
  3. Mint shares to receiver
  4. Execute leverage loop on new deposit
  5. Update collateral/debt tracking
  6. Emit Deposit(caller, receiver, assets, shares)

Requirements:
  - shares > 0
  - assets must not exceed maxDeposit(receiver)
```

### 2. Preview Functions (Query-Only)

```
Function: previewDeposit(uint256 assets) returns (uint256)
Purpose: Show exact shares that will be minted for given assets
Calculation: assets * totalShares / totalAssets (rounded down)
Rounding: DOWN
```

```
Function: previewMint(uint256 shares) returns (uint256)
Purpose: Show exact assets required to mint given shares
Calculation: shares * totalAssets / totalShares (rounded up)
Rounding: UP (user pays slightly more to ensure shares minted)
```

```
Function: previewWithdraw(uint256 assets) returns (uint256)
Purpose: Show shares that must be burned to receive assets
Calculation: assets * totalShares / totalAssets (rounded up)
Rounding: UP (user burns slightly more shares to ensure assets received)
```

```
Function: previewRedeem(uint256 shares) returns (uint256)
Purpose: Show exact assets that will be received for shares
Calculation: shares * totalAssets / totalShares (rounded down)
Rounding: DOWN
```

### 3. Withdrawal & Redemption (Withdrawal Side)

```
Function: withdraw(uint256 assets, address receiver, address owner)
Purpose: Burn shares from owner, unwind position proportionally, transfer assets to receiver
Parameters:
  - assets: Exact amount of assets to withdraw
  - receiver: Address to receive assets
  - owner: Address whose shares will be burned
Returns: shares (amount of shares burned)

Flow:
  1. Calculate shares = previewWithdraw(assets)
  2. If caller != owner, check allowance
  3. Burn shares from owner
  4. Unwind position (repay debt, withdraw collateral)
  5. Transfer assets to receiver
  6. Update collateral/debt tracking
  7. Ensure remaining positions have HF >= minHealthFactor
  8. Emit Withdraw(caller, receiver, owner, assets, shares)

Requirements:
  - assets > 0
  - assets <= maxWithdraw(owner)
  - Resulting HF must be >= minHealthFactor (or position fully closed)
```

```
Function: redeem(uint256 shares, address receiver, address owner)
Purpose: Inverse of withdraw - user specifies shares
Parameters:
  - shares: Exact number of shares to burn
  - receiver: Address to receive assets
  - owner: Address whose shares will be burned
Returns: assets (amount of assets transferred)

Flow:
  1. Calculate assets = previewRedeem(shares)
  2. If caller != owner, check allowance
  3. Burn shares from owner
  4. Unwind position proportionally (repay debt, withdraw collateral)
  5. Transfer assets to receiver
  6. Update collateral/debt tracking
  7. Ensure remaining positions have HF >= minHealthFactor
  8. Emit Withdraw(caller, receiver, owner, assets, shares)

Requirements:
  - shares > 0
  - shares <= maxRedeem(owner)
  - Resulting HF must be >= minHealthFactor
```

### 4. Max Functions (Risk Controls)

```
Function: maxDeposit(address receiver) returns (uint256)
Purpose: Return maximum assets that can be deposited by receiver
Returns:
  - type(uint256).max if no deposit cap enforced
  - Capped value if vault has size limits

Note: In leverage vaults, this may be limited by:
  - Remaining HyperFi pool liquidity
  - Maximum total leverage limits
  - Per-user deposit caps (optional)
```

```
Function: maxMint(address receiver) returns (uint256)
Purpose: Return maximum shares that can be minted for receiver
Returns: convertToShares(maxDeposit(receiver))
```

```
Function: maxWithdraw(address owner) returns (uint256)
Purpose: Return maximum assets that owner can withdraw without violating HF constraints
Calculation:
  1. Get current position data: (collateral, debt, HF)
  2. Calculate max assets such that: newHF >= minHealthFactor
  3. Account for liquidity in HypurrFi pools
Returns: min(calculatedMax, availableLiquidity)
```

```
Function: maxRedeem(address owner) returns (uint256)
Purpose: Return maximum shares that owner can burn
Returns: convertToShares(maxWithdraw(owner))
```

### 5. Leverage Loop Execution

```
Function: _executeLoop(uint256 initialAsset, address primaryAsset, address borrowAsset)
Internal: Automatically called after deposit
Purpose: Execute recursive supply → borrow → re-supply up to target leverage

Parameters:
  - initialAsset: Amount of asset user just deposited
  - primaryAsset: Asset being supplied (e.g., USDC)
  - borrowAsset: Asset being borrowed (e.g., USDXL)

State Variables Used:
  - targetLTV (e.g., 60% = 6000 bps)
  - maxLoopIterations (e.g., 4)
  - minHealthFactor (e.g., 1.15e18)

Algorithm:
  for i = 0 to maxLoopIterations:
    if i == 0:
      // Initial supply
      supply(primaryAsset, initialAsset)
    else:
      // Get current collateral value
      (collateral, debt, HF) = getPositionData()
      // Calculate max borrow
      maxBorrow = (collateral * targetLTV) - debt
      if maxBorrow == 0:
        break
      // Borrow and re-supply
      borrow(borrowAsset, maxBorrow)
      supply(borrowAsset, maxBorrow)

    // Check health factor
    (_, _, HF) = getPositionData()
    if HF < minHealthFactor:
      revert("Loop would create unsafe position")

  // After loop, verify final state
  (finalCollateral, finalDebt, finalHF) = getPositionData()
  require(finalHF >= targetHealthFactor, "Position not at target HF")
```

### 6. Rebalancing & Health Management

```
Function: rebalance()
Caller: Anyone (or only owner/keeper)
Purpose: Adjust vault leverage back to target health factor
Triggers:
  - If HF < minHealthFactor (under-collateralized)
  - If HF > maxHealthFactor (under-leveraged)

Algorithm (Deleveraging - HF too low):
  if HF < minHealthFactor:
    while HF < targetHealthFactor:
      // Repay debt to improve HF
      repayAmount = calculateRepayToDelta(currentDebt, targetHF)
      repay(borrowAsset, repayAmount)
      (collateral, debt, HF) = getPositionData()

Algorithm (Re-leveraging - HF too high):
  if HF > maxHealthFactor:
    while HF > targetHealthFactor:
      // Borrow more to increase leverage
      borrowAmount = calculateBorrowToDelta(currentDebt, targetHF)
      borrow(borrowAsset, borrowAmount)
      supply(borrowAsset, borrowAmount)
      (collateral, debt, HF) = getPositionData()

Requirements:
  - Final HF must be within acceptable range
  - Cannot drop below minHealthFactor
  - Emits RebalanceEvent with before/after metrics
```

```
Function: deleverageEmergency()
Caller: Only owner/admin
Purpose: Fully unwind the vault position in emergency
Execution:
  1. Pause new deposits
  2. Repay all outstanding debt
  3. Withdraw all collateral
  4. Return assets pro-rata to all share holders
  5. Optionally reset vault to idle state
```

### 7. View Functions (Position Querying)

```
Function: getPositionDetails() returns (
  uint256 totalCollateral,
  uint256 totalDebt,
  uint256 healthFactor,
  uint256 currentLeverage,
  uint256 totalAssets
)
Purpose: Snapshot of current vault position across HypurrFi
Data Source: HypurrFi getUserAccountData() + price oracle queries
```

```
Function: getUserShareValue(address user) returns (uint256)
Purpose: Value in underlying assets of user's shares
Calculation: balanceOf(user) * totalAssets() / totalShares()
```

```
Function: getVaultMetrics() returns (
  uint256 totalAssets,
  uint256 totalShares,
  uint256 exchangeRate,
  uint256 targetHF,
  uint256 currentHF,
  uint256 targetLTV
)
Purpose: Full vault state snapshot
```

---

## State Variables & Configuration

### Storage Layout

```solidity
// Core ERC-4626 state (inherited from ERC20)
mapping(address => uint256) public balanceOf;           // Shares per user
mapping(address => mapping(address => uint256)) public allowance;  // ERC20 approval
uint256 public totalSupply;                             // Total shares outstanding

// Vault configuration
address public immutable asset;                         // Primary asset (USDC)
address public immutable hypurrfiPool;                  // HypurrFi Pool address
address public owner;                                   // Vault owner/admin

// Target parameters
uint256 public targetHealthFactor = 1.3e18;             // 130% (1.3 * 10^18)
uint256 public minHealthFactor = 1.15e18;               // 115% (rebalance trigger)
uint256 public maxHealthFactor = 1.5e18;                // 150% (re-lever trigger)
uint256 public targetLTV = 6000;                        // 60% in basis points (10000 = 100%)
uint256 public maxLoopIterations = 4;                   // Max recursive supply/borrow cycles

// Risk controls
bool public paused = false;                             // Emergency pause flag
uint256 public maxTotalAssets = type(uint256).max;      // Cap on vault size (optional)
uint256 public maxDepositPerUser = type(uint256).max;   // Per-user cap (optional)

// Fee tracking
uint256 public depositFeePercent = 0;                   // In basis points (100 = 1%)
uint256 public withdrawFeePercent = 0;                  // In basis points
address public feeRecipient;                            // Where fees go

// Oracle & pricing
address public priceOracle;                             // HypurrFi oracle or external
mapping(address => bool) public whitelistedAssets;      // Allowed deposit/borrow assets

// Position state (cached for gas efficiency)
uint256 public lastTotalAssets;                         // Last recorded totalAssets
uint256 public lastUpdated;                             // Last update timestamp

// Accrued interest & performance
uint256 public accumulatedFees;                         // Fees not yet withdrawn
uint256 public lastHarvestTime;                         // Last claim of HYPE rewards (future)
```

### Configuration Parameters

| Parameter | Value | Unit | Description |
|-----------|-------|------|-------------|
| `targetHealthFactor` | 1.3 | 10^18 | Target collateral ratio |
| `minHealthFactor` | 1.15 | 10^18 | Trigger for deleveraging |
| `maxHealthFactor` | 1.5 | 10^18 | Trigger for re-leveraging |
| `targetLTV` | 6000 | bps | 60% loan-to-value ratio |
| `maxLoopIterations` | 4 | count | Max recursive loop cycles |
| `depositFeePercent` | 0-100 | bps | Fee on deposits (0-1%) |
| `withdrawFeePercent` | 0-100 | bps | Fee on withdrawals (0-1%) |
| `updateInterval` | 3600 | sec | Min time between rebalances |
| `maxTotalAssets` | unlimited | tokens | Vault size cap (optional) |

### Constants

```solidity
// Precision & decimals
uint256 constant DECIMALS = 18;
uint256 constant BASIS_POINTS = 10000;
uint256 constant RAY = 10**27;  // For calculations matching HypurrFi's precision

// HypurrFi Pool constants
uint256 constant VARIABLE_INTEREST_RATE_MODE = 2;      // Variable rate (vs stable=1)
uint256 constant REFERRAL_CODE = 0;

// Asset addresses (HyperEVM Mainnet)
address constant USDC = 0xb88339CB7199b77E23DB6E890353E22632Ba630f;
address constant USDXL = 0xca79db4b49f608ef54a5cb813fbed3a6387bc645;
address constant USDT0 = 0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb;
address constant HYPE = 0xb54CAe4F94da01c0E1DC0b6d6c67F6Dea8d9b3e6;
address constant stHYPE = 0x1f6f5C0999b2C296aae8F1a4a72ba30Ca303Dc85;

// HypurrFi Pool address
address constant HYPURRFI_POOL = 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b;

// Oracle address
address constant HYPURRFI_ORACLE = 0xB1B1b2A8CeCCFBb7C7E2a0D7b5e5f7D5C0A5a4a3;
```

---

## Leverage Loop Mechanics

### Understanding Leverage in Lending Protocols

In HypurrFi (Aave V3-style), leverage is built by:

1. **Supply collateral** (e.g., 100 USDC)
2. **Borrow** a percentage based on the asset's LTV (e.g., 60% → borrow 60)
3. **Re-supply** the borrowed asset as additional collateral
4. **Repeat** to target health factor

### Example: 100 USDC Deposit with 60% Target LTV

```
Initial Deposit: 100 USDC

Iteration 0: Supply 100 USDC
  Collateral: 100 USDC value
  Debt: 0
  HF: ∞

Iteration 1: Borrow against USDC (60% of 100)
  Borrow: 60 USDXL
  Supply: 60 USDXL
  Collateral: 100 USDC + 60 USDXL = 160 value
  Debt: 60 USDXL = 60 value
  HF: 160 / 60 = 2.67

Iteration 2: Borrow against total collateral (60% of 160)
  Max Borrow: 96 - 60 = 36 USDXL (already borrowed 60)
  Borrow: 36 USDXL
  Supply: 36 USDXL
  Collateral: 160 + 36 = 196
  Debt: 96
  HF: 196 / 96 = 2.04

Iteration 3: Borrow again
  Max Borrow: 117.6 - 96 = 21.6
  Collateral: 217.6
  Debt: 117.6
  HF: 1.85

Iteration 4: Final iteration
  Max Borrow: 130.56 - 117.6 = 12.96
  Collateral: 230.56
  Debt: 130.56
  HF: 1.77
  Leverage: 230.56 / 100 = 2.3x

Final Position:
  Total Collateral: ~230.56 in stablecoin value
  Total Debt: ~130.56 USDXL
  Health Factor: ~1.77 (close to target 1.3 after decay)
  Net Leverage: ~2.3x
  Yield Sources: Interest on ~230 supplied assets
  Cost Sources: Interest on ~130 borrowed assets
  Net APY: Supply APY * 2.3 - Borrow APY * 1.3
```

### Rebalancing Mechanics

**Scenario: Health Factor Drops Below Minimum**

Initial state (from above):
- Collateral: 230.56 USDXL equivalent
- Debt: 130.56 USDXL
- HF: 1.77
- Target: 1.3

Market movement (e.g., USDC price drops 5%, increasing USDXL relative value):
- New Collateral: 218.8 USDXL equivalent
- New Debt: 130.56 USDXL (unchanged)
- New HF: 218.8 / 130.56 = 1.68

If HF drops to 1.15 (minimum), trigger rebalancing:

```
Deleveraging Algorithm:
  1. Current HF: 1.15
  2. Target HF: 1.3
  3. Repay debt to improve HF

  Repay Amount = (Debt * (currentHF - targetHF)) / targetHF
               = (130.56 * (1.15 - 1.3)) / 1.3
               = (130.56 * -0.15) / 1.3
               = 15.07 USDXL

  After repayment:
  - Collateral: 218.8 (unchanged, USDXL collateral value)
  - Debt: 130.56 - 15.07 = 115.49
  - New HF: 218.8 / 115.49 = 1.89 (above target 1.3)

  // Could re-loop to get closer to target, but safer to stay above
```

**Scenario: Health Factor Rises Above Maximum**

HF grows above 1.5 (over-conservative position):
- User could borrow more to increase yields
- Algorithm borrows additional amount and re-supplies
- New HF targets the target threshold (1.3)

```
Re-leveraging Algorithm:
  Current HF: 1.6
  Target HF: 1.3

  Additional Borrow = (Collateral / targetHF) - currentDebt
  New Borrow = (218.8 / 1.3) - 115.49
             = 168.31 - 115.49
             = 52.82 USDXL

  After borrowing:
  - Collateral: 218.8 + 52.82 = 271.62
  - Debt: 115.49 + 52.82 = 168.31
  - New HF: 271.62 / 168.31 = 1.61 (still high, but improved)
```

### Multi-Asset Support (Advanced)

The vault can support multiple deposit assets:

```
Example: HYPE Leverage Loop

User deposits 100 HYPE
→ Supply 100 HYPE to HypurrFi
→ Borrow USDXL (60% LTV based on HYPE price)
→ Supply USDXL as secondary collateral
→ Loop continues...

Position:
- Primary Collateral: 100 HYPE (price-variable)
- Secondary Collateral: USDXL (stablecoin, price-stable)
- Debt: USDXL (stablecoin-denominated)
- Health Factor: Weighted average based on liquidation prices

Benefits:
- Leveraged exposure to HYPE
- Stable debt denominated in USDXL
- Yield from both HYPE supply and USDXL operations
```

---

## Risk Management & Health Monitoring

### Health Factor Calculation

In HypurrFi (Aave V3 compatible):

```
Health Factor = Total Collateral Value / Total Debt Value
              = (collateral₁ * price₁ * ltv₁ + collateral₂ * price₂ * ltv₂) /
                (debt₁ * price₁ + debt₂ * price₂)

Where:
- ltv = Loan-To-Value (e.g., 0.8 for 80% LTV)
- price = Current oracle price
- Liquidation occurs when HF < 1.0
```

Example:
```
Position:
- 100 USDC @ $1.00 with 80% LTV
- 60 USDXL @ $1.00 with 70% LTV as collateral
- 60 USDXL debt

HF = (100 * 1.0 * 0.8 + 60 * 1.0 * 0.7) / (60 * 1.0)
   = (80 + 42) / 60
   = 122 / 60
   = 2.03
```

### Risk Tiers & Action Levels

| Condition | Health Factor | Action | Urgency |
|-----------|---------------|--------|---------|
| Safe | HF > 1.5 | Can increase leverage | Low |
| Target | 1.3 ≤ HF ≤ 1.5 | Maintain position | None |
| Warning | 1.15 < HF < 1.3 | Monitor closely | Medium |
| Critical | HF < 1.15 | Trigger rebalance | High |
| Danger | HF < 1.0 | Liquidation imminent | Critical |

### Liquidation Risk Assessment

```
Function: getLiquidationPrice()
Purpose: Calculate asset price at which position gets liquidated
Formula:
  liquidationPrice = debtValue / (collateralValue / liquidationPrice)

  For single-asset (USDC) position:
  liquidationPrice = debt / (collateral * ltv)

Example:
  Collateral: 230.56 USDC
  Debt: 130.56 USDXL
  USDC LTV: 0.8
  USDXL LTV: 0.75

  At liquidation (HF = 1.0):
  230.56 * 0.8 + supplied_USDXL * 0.75 = 130.56 + borrowed_USDXL

  Estimated liquidation price: ~0.90 USDC
  (position underwater if USDC drops 10%)
```

### Monitoring & Alert System

```solidity
// Recommended keeper/monitor implementation
struct HealthAlert {
    uint256 timestamp;
    uint256 healthFactor;
    uint256 collateral;
    uint256 debt;
    AlertType alertType;
}

enum AlertType {
    NONE,
    WARNING,      // HF below 1.3
    CRITICAL,     // HF below 1.15
    LIQUIDATION   // HF below 1.0
}

function checkAndEmitAlert() external {
    (collateral, debt, HF) = getPositionData();

    if (HF < 1.0) {
        emit Alert(AlertType.LIQUIDATION, HF);
    } else if (HF < minHealthFactor) {
        emit Alert(AlertType.CRITICAL, HF);
    } else if (HF < targetHealthFactor) {
        emit Alert(AlertType.WARNING, HF);
    }
}
```

### Rebalancing Triggers

```
Automatic Triggers:
1. HF < minHealthFactor (1.15) → Deleverage
2. HF > maxHealthFactor (1.5) → Re-leverage
3. Time-based: Daily/weekly rebalance for interest accrual
4. Manual: Admin/keeper can call anytime

Rebalance Constraints:
- Cannot execute if vault paused
- Cannot reduce HF below minHealthFactor
- Must emit event before/after with metrics
- Should use non-reentrant guard
```

---

## Pseudo-Code Implementation

### Main Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IHypurrFiPool.sol";
import "./interfaces/IPriceOracle.sol";

contract HypurrFiLeverageVault is ERC20, ReentrancyGuard, Ownable {

    // ==================== Events ====================

    event Deposit(
        address indexed caller,
        address indexed receiver,
        uint256 assets,
        uint256 shares
    );

    event Withdraw(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );

    event Rebalance(
        uint256 oldHF,
        uint256 newHF,
        uint256 collateral,
        uint256 debt,
        uint256 timestamp
    );

    event LoopExecuted(
        uint256 iterations,
        uint256 finalCollateral,
        uint256 finalDebt,
        uint256 finalHF
    );

    // ==================== State Variables ====================

    address public immutable asset;                    // USDC or primary deposit asset
    address public immutable pool;                     // HypurrFi Pool
    IPriceOracle public oracle;                        // Price oracle

    // Configuration
    uint256 public targetHealthFactor = 1.3e18;
    uint256 public minHealthFactor = 1.15e18;
    uint256 public maxHealthFactor = 1.5e18;
    uint256 public targetLTV = 6000;                   // 60% in bps
    uint256 public maxLoopIterations = 4;

    // Risk controls
    bool public paused = false;
    uint256 public maxTotalAssets = type(uint256).max;

    // Fee tracking
    uint256 public depositFeePercent = 0;              // 0-100 bps
    uint256 public withdrawFeePercent = 0;
    address public feeRecipient;
    uint256 public accumulatedFees;

    // ==================== Modifiers ====================

    modifier whenNotPaused() {
        require(!paused, "Vault paused");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be > 0");
        _;
    }

    // ==================== Constructor ====================

    constructor(
        address _asset,
        address _pool,
        address _oracle,
        address _feeRecipient
    ) ERC20("HypurrFi Leverage Vault", "hvLEV") {
        asset = _asset;
        pool = _pool;
        oracle = IPriceOracle(_oracle);
        feeRecipient = _feeRecipient;

        // Approve infinite spending to pool
        IERC20(_asset).approve(_pool, type(uint256).max);
    }

    // ==================== ERC-4626 Core Functions ====================

    function deposit(uint256 assets, address receiver)
        external
        nonReentrant
        whenNotPaused
        validAmount(assets)
        returns (uint256 shares)
    {
        // 1. Transfer assets from caller
        require(
            IERC20(asset).transferFrom(msg.sender, address(this), assets),
            "Transfer failed"
        );

        // 2. Calculate shares
        shares = previewDeposit(assets);
        require(shares > 0, "Shares = 0");

        // 3. Check deposit limits
        require(
            totalAssets() + assets <= maxTotalAssets,
            "Exceeds max vault size"
        );

        // 4. Mint shares to receiver
        _mint(receiver, shares);

        // 5. Execute leverage loop
        _executeLoop(assets, asset, _getBorrowAsset(asset));

        // 6. Verify health factor
        (, , uint256 hf) = _getPositionData();
        require(hf >= minHealthFactor, "Position unsafe after loop");

        emit Deposit(msg.sender, receiver, assets, shares);
        return shares;
    }

    function mint(uint256 shares, address receiver)
        external
        nonReentrant
        whenNotPaused
        validAmount(shares)
        returns (uint256 assets)
    {
        assets = previewMint(shares);
        require(assets > 0, "Assets = 0");

        // Transfer and execute
        require(
            IERC20(asset).transferFrom(msg.sender, address(this), assets),
            "Transfer failed"
        );

        _mint(receiver, shares);
        _executeLoop(assets, asset, _getBorrowAsset(asset));

        (, , uint256 hf) = _getPositionData();
        require(hf >= minHealthFactor, "Position unsafe");

        emit Deposit(msg.sender, receiver, assets, shares);
        return assets;
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    )
        external
        nonReentrant
        validAmount(assets)
        returns (uint256 shares)
    {
        // 1. Check allowance if not owner
        if (msg.sender != owner) {
            uint256 allowed = allowance[owner][msg.sender];
            require(allowed >= assets, "Insufficient allowance");
            allowance[owner][msg.sender] = allowed - assets;
        }

        // 2. Calculate shares needed
        shares = previewWithdraw(assets);
        require(shares > 0, "Shares = 0");
        require(shares <= balanceOf[owner], "Insufficient shares");

        // 3. Burn shares
        _burn(owner, shares);

        // 4. Unwind position
        _unwindPosition(assets);

        // 5. Transfer assets to receiver
        require(
            IERC20(asset).transfer(receiver, assets),
            "Transfer failed"
        );

        // 6. Verify remaining position health
        if (totalSupply > 0) {
            (, , uint256 hf) = _getPositionData();
            require(hf >= minHealthFactor, "Remaining position unsafe");
        }

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        return shares;
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    )
        external
        nonReentrant
        validAmount(shares)
        returns (uint256 assets)
    {
        if (msg.sender != owner) {
            uint256 allowed = allowance[owner][msg.sender];
            require(allowed >= shares, "Insufficient allowance");
            allowance[owner][msg.sender] = allowed - shares;
        }

        assets = previewRedeem(shares);
        require(assets > 0, "Assets = 0");

        _burn(owner, shares);
        _unwindPosition(assets);

        require(
            IERC20(asset).transfer(receiver, assets),
            "Transfer failed"
        );

        if (totalSupply > 0) {
            (, , uint256 hf) = _getPositionData();
            require(hf >= minHealthFactor, "Remaining position unsafe");
        }

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        return assets;
    }

    // ==================== Preview Functions ====================

    function previewDeposit(uint256 assets)
        public
        view
        returns (uint256)
    {
        uint256 total = totalAssets();
        uint256 supply = totalSupply;

        if (supply == 0 || total == 0) {
            return assets;
        }

        // shares = assets * totalShares / totalAssets (round down)
        return (assets * supply) / total;
    }

    function previewMint(uint256 shares)
        public
        view
        returns (uint256)
    {
        uint256 total = totalAssets();
        uint256 supply = totalSupply;

        if (supply == 0 || total == 0) {
            return shares;
        }

        // assets = shares * totalAssets / totalShares (round up)
        return (shares * total + supply - 1) / supply;
    }

    function previewWithdraw(uint256 assets)
        public
        view
        returns (uint256)
    {
        uint256 total = totalAssets();
        uint256 supply = totalSupply;

        if (supply == 0 || total == 0) {
            return assets;
        }

        // shares = assets * totalShares / totalAssets (round up)
        return (assets * supply + total - 1) / total;
    }

    function previewRedeem(uint256 shares)
        public
        view
        returns (uint256)
    {
        uint256 total = totalAssets();
        uint256 supply = totalSupply;

        if (supply == 0) {
            return 0;
        }

        // assets = shares * totalAssets / totalShares (round down)
        return (shares * total) / supply;
    }

    // ==================== Max Functions ====================

    function maxDeposit(address) external view returns (uint256) {
        if (paused) return 0;
        return maxTotalAssets > totalAssets()
            ? maxTotalAssets - totalAssets()
            : 0;
    }

    function maxMint(address receiver) external view returns (uint256) {
        return previewDeposit(maxTotalAssets);
    }

    function maxWithdraw(address owner) external view returns (uint256) {
        uint256 maxByShares = previewRedeem(balanceOf[owner]);

        // Also check if withdrawal would breach health factor
        try this._maxWithdrawSafe(owner) returns (uint256 maxSafe) {
            return min(maxByShares, maxSafe);
        } catch {
            return maxByShares;  // Fallback if HF calc fails
        }
    }

    function maxRedeem(address owner) external view returns (uint256) {
        return balanceOf[owner];
    }

    // ==================== Leverage Loop & Rebalancing ====================

    function _executeLoop(
        uint256 initialAsset,
        address supplyAsset,
        address borrowAsset
    ) internal {
        uint256 iterations = 0;
        uint256 toSupply = initialAsset;

        for (iterations = 0; iterations < maxLoopIterations; iterations++) {
            // Supply
            IHypurrFiPool(pool).supply(
                supplyAsset,
                toSupply,
                address(this),
                0
            );

            // Get position and calculate max borrow
            (uint256 collateral, uint256 debt, ) = _getPositionData();

            uint256 maxBorrow = (collateral * targetLTV / 10000) - debt;
            if (maxBorrow == 0) break;

            // Borrow
            IHypurrFiPool(pool).borrow(
                borrowAsset,
                maxBorrow,
                2,  // Variable rate
                0,  // Referral
                address(this)
            );

            toSupply = maxBorrow;

            // Check health factor
            (, , uint256 hf) = _getPositionData();
            if (hf < minHealthFactor) {
                revert("Loop would create unsafe position");
            }
        }

        (uint256 finalCollateral, uint256 finalDebt, uint256 finalHF) =
            _getPositionData();

        emit LoopExecuted(iterations, finalCollateral, finalDebt, finalHF);
    }

    function rebalance()
        external
        nonReentrant
        returns (bool)
    {
        (uint256 collateral, uint256 debt, uint256 hf) = _getPositionData();

        if (hf < minHealthFactor) {
            // Deleverage
            _deleverageToTarget();
        } else if (hf > maxHealthFactor) {
            // Re-leverage
            _releverageToTarget();
        } else {
            return false;  // No rebalancing needed
        }

        (uint256 newCollateral, uint256 newDebt, uint256 newHF) =
            _getPositionData();

        emit Rebalance(hf, newHF, newCollateral, newDebt, block.timestamp);
        return true;
    }

    function _deleverageToTarget() internal {
        (uint256 collateral, uint256 debt, uint256 hf) = _getPositionData();

        while (hf < targetHealthFactor) {
            uint256 toRepay = (debt * (targetHealthFactor - hf)) / targetHealthFactor / 10**18;

            if (toRepay == 0) break;

            address borrowAsset = _getBorrowAsset(asset);

            IHypurrFiPool(pool).repay(
                borrowAsset,
                toRepay,
                2,  // Variable rate
                address(this)
            );

            (collateral, debt, hf) = _getPositionData();
        }
    }

    function _releverageToTarget() internal {
        (uint256 collateral, uint256 debt, uint256 hf) = _getPositionData();
        address borrowAsset = _getBorrowAsset(asset);

        while (hf > maxHealthFactor) {
            uint256 maxNewBorrow = (collateral * targetLTV / 10000) - debt;

            if (maxNewBorrow == 0) break;

            IHypurrFiPool(pool).borrow(
                borrowAsset,
                maxNewBorrow,
                2,
                0,
                address(this)
            );

            IHypurrFiPool(pool).supply(
                borrowAsset,
                maxNewBorrow,
                address(this),
                0
            );

            (collateral, debt, hf) = _getPositionData();
        }
    }

    // ==================== Internal Helpers ====================

    function _unwindPosition(uint256 assetsToWithdraw) internal {
        address borrowAsset = _getBorrowAsset(asset);

        // Simple proportional unwinding
        (uint256 collateral, uint256 debt, ) = _getPositionData();

        uint256 debtRatio = (debt * 1e18) / collateral;
        uint256 debtToRepay = (assetsToWithdraw * debtRatio) / 1e18;

        // Repay debt
        IHypurrFiPool(pool).repay(
            borrowAsset,
            debtToRepay,
            2,
            address(this)
        );

        // Withdraw collateral
        IHypurrFiPool(pool).withdraw(
            asset,
            assetsToWithdraw,
            address(this)
        );
    }

    function _getPositionData()
        internal
        view
        returns (uint256 collateral, uint256 debt, uint256 hf)
    {
        (
            uint256 totalCollateral,
            uint256 totalDebt,
            ,
            ,
            ,
            uint256 healthFactor
        ) = IHypurrFiPool(pool).getUserAccountData(address(this));

        return (totalCollateral, totalDebt, healthFactor);
    }

    function _getBorrowAsset(address supplyAsset)
        internal
        pure
        returns (address)
    {
        // For now, borrow USDXL (stablecoin) regardless of supply asset
        // Could be extended for multi-asset strategies
        return 0xca79db4b49f608ef54a5cb813fbed3a6387bc645;  // USDXL
    }

    function totalAssets() public view returns (uint256) {
        (uint256 collateral, uint256 debt, ) = _getPositionData();

        // Total assets = collateral value - debt
        // Simplified: assumes stablecoins 1:1 value
        return collateral > debt ? collateral - debt : 0;
    }

    function convertToShares(uint256 assets)
        public
        view
        returns (uint256)
    {
        return previewDeposit(assets);
    }

    function convertToAssets(uint256 shares)
        public
        view
        returns (uint256)
    {
        return previewRedeem(shares);
    }

    // ==================== Owner Functions ====================

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function deleverageEmergency() external onlyOwner nonReentrant {
        (uint256 collateral, uint256 debt, ) = _getPositionData();
        address borrowAsset = _getBorrowAsset(asset);

        // Repay all debt
        IHypurrFiPool(pool).repay(
            borrowAsset,
            type(uint256).max,
            2,
            address(this)
        );

        // Withdraw all collateral
        IHypurrFiPool(pool).withdraw(
            asset,
            type(uint256).max,
            address(this)
        );

        paused = true;
    }

    function setTargetHealthFactor(uint256 _hf) external onlyOwner {
        require(_hf >= 1.1e18 && _hf <= 2.0e18, "Invalid HF");
        targetHealthFactor = _hf;
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        feeRecipient = _recipient;
    }
}
```

---

## Security Considerations

### Critical Risk Factors

#### 1. Oracle Manipulation

**Risk:** Malicious actors manipulate price feeds to artificially inflate collateral values.

**Mitigation:**
- Use HypurrFi's battle-tested oracle (Hyperliquid price feeds)
- Implement price deviation checks (circuit breakers)
- Use Time-Weighted Average Prices (TWAP) for sensitive operations
- Monitor oracle updates for anomalies

```solidity
function _validatePriceUpdate(address asset, uint256 oldPrice, uint256 newPrice)
    internal
    view
{
    // Price deviation check: max 10% movement in one update
    uint256 deviation = (newPrice > oldPrice)
        ? ((newPrice - oldPrice) * 100) / oldPrice
        : ((oldPrice - newPrice) * 100) / oldPrice;

    require(deviation <= 10, "Price deviation too high");
}
```

#### 2. Liquidation Risk

**Risk:** Position gets liquidated when health factor < 1.0, causing capital loss + liquidation penalty (8%).

**Mitigation:**
- Set conservative target HF (1.3 = 30% safety margin)
- Automatic rebalancing at HF < 1.15
- Monitor continuously with off-chain keeper
- Users must understand liquidation risks

#### 3. Interest Rate Volatility

**Risk:** Borrow rates increase sharply, reducing net yield or creating losses.

**Mitigation:**
- Monitor APY spreads (supply APY vs. borrow APY)
- Implement circuit breakers for extreme rate changes
- Document rate risk in UI/docs
- Allow users to exit positions

#### 4. Smart Contract Vulnerabilities

**Risk:** Bugs in contract code enable theft/loss of funds.

**Mitigation:**
- Use audited libraries (OpenZeppelin)
- Implement ReentrancyGuard on state-changing functions
- Use Checks-Effects-Interactions pattern
- Comprehensive test suite with fuzzing
- Professional audit before mainnet deployment

```solidity
// Good: CEI pattern
function deposit(uint256 assets) external {
    // CHECKS
    require(assets > 0, "Zero amount");
    require(balanceOf[msg.sender] >= assets, "Insufficient balance");

    // EFFECTS (state changes first)
    balanceOf[msg.sender] -= assets;
    totalDeposited += assets;

    // INTERACTIONS (external calls last)
    IERC20(token).transfer(recipient, assets);
}
```

#### 5. Flash Loan Attacks

**Risk:** Attacker borrows huge amount, manipulates prices, withdraws at inflated value, repays flash loan.

**Mitigation:**
- Use ReentrancyGuard to prevent multiple calls
- Implement checks that position remained healthy before & after
- Use price oracles that resist flash loan manipulation

### Defensive Programming Practices

```solidity
// 1. Require checks
require(amount > 0, "Invalid amount");
require(amount <= maxDeposit(msg.sender), "Exceeds max deposit");

// 2. Safe math (using Solidity 0.8+)
uint256 result = a + b;  // Reverts on overflow

// 3. Reentrancy guards
modifier nonReentrant {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
}

// 4. Sanity checks on calculations
require(convertToShares(x) * convertToAssets(1) >= x, "Rounding integrity");

// 5. Explicit return values
require(token.approve(spender, amount), "Approval failed");
require(token.transfer(recipient, amount), "Transfer failed");
```

### Audit Checklist

Before deploying to mainnet:

- [ ] All functions have appropriate access controls (onlyOwner, nonReentrant, etc.)
- [ ] Health factor calculations match HypurrFi's actual logic
- [ ] Rounding always favors vault safety (down on shares, up on assets)
- [ ] Liquidation price calculations verified
- [ ] Reentrancy guards on all state-changing functions
- [ ] Emergency pause/deleverage mechanism tested
- [ ] Deployment script tested on testnet
- [ ] Integration tests with mock HypurrFi contracts
- [ ] Fuzz testing on conversion functions
- [ ] Professional security audit completed
- [ ] Insurance/rug pull disclosure documented

---

## Deployment Checklist

### Pre-Deployment

- [ ] Solidity compiler: ^0.8.19 (matches OpenZeppelin 5.x)
- [ ] All dependencies installed and versions pinned
- [ ] Contract passes all unit tests
- [ ] Gas optimization review completed
- [ ] Security audit report obtained
- [ ] HyperEVM testnet deployment verified

### Deployment Steps

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy to HyperEVM testnet
npx hardhat deploy --network hyperevmTestnet

# 3. Verify contract on block explorer
npx hardhat verify --network hyperevmTestnet <VAULT_ADDRESS>

# 4. Initialize vault parameters
npx hardhat run scripts/initializeVault.ts --network hyperevmTestnet

# 5. Run end-to-end tests on testnet
npx hardhat test --network hyperevmTestnet

# 6. Submit to HyperEVM official channel for inclusion in deployment registry
```

### Post-Deployment

- [ ] Monitor transaction success rate
- [ ] Set up automated health factor monitoring
- [ ] Configure emergency pause access
- [ ] Document all contract addresses
- [ ] Publish security audit report
- [ ] Launch frontend UI
- [ ] Create demo video
- [ ] Submit to HypurrFi bounty judges

### Contract Addresses (HyperEVM Mainnet)

```
HypurrFiLeverageVault: [TBD - after mainnet deployment]
USDC: 0xb88339CB7199b77E23DB6E890353E22632Ba630f
USDXL: 0xca79db4b49f608ef54a5cb813fbed3a6387bc645
HypurrFi Pool: 0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b
Oracle: 0xB1B1b2A8CeCCFBb7C7E2a0D7b5e5f7D5C0A5a4a3
```

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Multi-Asset Support**
   - Accept HYPE, stHYPE, USDT0 as deposit assets
   - Automatic conversion to primary asset via DEX route
   - Per-asset leverage targets

2. **Automated Rebalancing**
   - Integrate with Gelato Network for automated rebalance triggers
   - Chainlink Keepers backup
   - Keeper bot infrastructure

3. **Yield Optimization**
   - Claim HYPE distribution rewards from HypurrFi
   - Auto-compound into additional collateral
   - Integrate with other HyperEVM protocols for extra yield

4. **Risk Dashboard**
   - Real-time health factor monitoring
   - Liquidation price tracking
   - Historical APY/performance analytics
   - Community governance

5. **Advanced Strategies**
   - Delta-neutral positions (long HYPE, short synthetic)
   - Market-neutral farming
   - Volatility harvesting

### Phase 3: Ecosystem Integration

1. **Governance**
   - DAO for parameter updates
   - Risk committee oversight
   - Fee distribution via token

2. **Risk Insurance**
   - Integration with risk protocols
   - Insurance for liquidation events
   - Slashing conditions

3. **Composability**
   - Vault tokens used as collateral elsewhere
   - Interaction with other HyperEVM money legos
   - Cross-chain bridge support

---

## References & Resources

### ERC-4626 Standards
- **Official EIP:** https://eips.ethereum.org/EIPS/eip-4626
- **Ethereum.org Guide:** https://ethereum.org/developers/docs/standards/tokens/erc-4626
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/contracts/5.x/erc4626

### HypurrFi Documentation
- **Overview:** https://docs.hypurr.fi/introduction/hypurrfi
- **Pool Contract:** https://docs.hypurr.fi/developers/smartcontracts/core/pool
- **Oracle:** https://docs.hypurr.fi/primitives/oracle
- **Addresses:** https://docs.hypurr.fi/developers/addresses

### Security Resources
- **OpenZeppelin Security:** https://docs.openzeppelin.com/contracts/5.x/security
- **Solidity Best Practices:** https://solidity.readthedocs.io
- **DeFi Security:** https://blog.openzeppelin.com/security-audits

### Reference Implementations
- **Solmate ERC-4626:** https://github.com/transmissions11/solmate/blob/main/src/tokens/ERC4626.sol
- **OpenZeppelin ERC-4626:** https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC4626/
- **Aave V3 Protocol:** https://github.com/aave/aave-v3-core

---

## Conclusion

The **HypurrFi Leverage Loop Vault** combines the standardized ERC-4626 vault interface with sophisticated leverage automation to create an accessible yet powerful DeFi primitive. By abstracting complex supply-borrow-rebalancing mechanics, the vault enables retail users to access institutional-grade leverage strategies with minimal friction.

**Key Design Principles:**
1. **Standards Compliance** - ERC-4626 for composability
2. **Safety First** - Conservative parameters, continuous health monitoring
3. **Simplicity** - One-click deposits, automatic leverage
4. **Transparency** - Clear risk disclosures, health metrics
5. **Extensibility** - Modular design for future enhancements

This design document serves as the blueprint for implementation. The actual contract should undergo professional security audit and extensive testing before mainnet deployment.

---

**Document Version:** 1.0
**Last Updated:** November 15, 2025
**Status:** Ready for Implementation
**Next Steps:** Begin contract development following pseudo-code specifications
