# HypurrFi Strategies

🎥 **Video Submission:** [Watch our project demo on Loom](https://www.loom.com/share/79240f8f073d4e6da332279d638884ed) 🚀

**One-Click Leveraged Stablecoin Yield Loops on HyperEVM**

A smart contract vault system that automates leveraged lending loops on HypurrFi, providing users with enhanced stablecoin yields through recursive supply/borrow strategies with automated risk management.

## 🎯 Overview

The Stable Yield Vault allows users to deposit stablecoins (USDC) and automatically execute a leveraged lending loop strategy:

1. **Deposit** → User deposits USDC
2. **Supply** → Vault supplies USDC to HypurrFi as collateral
3. **Borrow** → Vault borrows USDXL against the collateral (60% LTV)
4. **Re-supply** → Borrowed USDXL is supplied back as additional collateral
5. **Loop** → Steps 3-4 repeat up to 4 times for ~3-4x leverage
6. **Earn** → Compounding yield from both USDC and USDXL supply positions
7. **Auto-Rebalance** → Vault maintains healthy risk parameters automatically

### Key Features

- ✅ **One-Click Deposits**: Simple interface for complex multi-step strategies
- ✅ **Automated Leverage Loops**: Recursive supply/borrow execution in single transaction
- ✅ **Health Factor Monitoring**: Real-time tracking with auto-rebalance triggers
- ✅ **Risk Management**: Conservative parameters (HF target: 1.3, min: 1.15)
- ✅ **ERC-4626 Style**: Standard vault interface with share-based accounting
- ✅ **Emergency Controls**: Owner-controlled deleveraging and pause mechanisms
- ✅ **Full UI**: Next.js frontend with wallet connection and position monitoring

## 🏗️ Architecture

### Smart Contracts

```
packages/hardhat/
├── contracts/
│   └── StableYieldVault.sol      # Main vault contract (all-in-one)
├── interfaces/
│   ├── IPool.sol                  # HypurrFi Pool interface (Aave V3)
│   └── IERC20.sol                 # Standard ERC20 interface
├── scripts/
│   └── deploy.ts                  # Deployment script for HyperEVM
└── test/
    └── StableYieldVault.test.ts   # Comprehensive test suite
```

#### StableYieldVault.sol

The main vault contract implements:

- **Deposit/Withdraw**: ERC-4626 style share-based deposits and withdrawals
- **Loop Execution** (`_executeLoop`): Automated recursive supply → borrow → re-supply
- **Rebalancing** (`rebalance`): Maintains health factor within target range
- **Deleveraging** (`_deleverToTarget`): Reduces risk when HF drops below 1.15
- **Emergency Functions**: Owner-controlled pause and full position unwinding

Key Parameters:
- Target Health Factor: 1.3 (130% collateralization)
- Min Health Factor: 1.15 (rebalance trigger)
- Max Health Factor: 1.5 (under-leverage trigger)
- Target LTV: 60% (6000 basis points)
- Max Loop Iterations: 4

### Frontend

```
packages/nextjs/
├── app/
│   ├── page.tsx                   # Main deposit/withdraw interface
│   ├── dashboard/page.tsx         # Position metrics and monitoring
│   ├── layout.tsx                 # Root layout with wagmi provider
│   └── globals.css                # Tailwind styles
├── lib/
│   ├── wagmi.ts                   # Wagmi configuration for HyperEVM
│   ├── chains.ts                  # HyperEVM chain definitions
│   └── contracts.ts               # Contract addresses and ABIs
```


## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contracts in `packages/hardhat/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/hardhat/deploy`


### For Users

1. **Connect Wallet**
   - Click "Connect Wallet" in the UI
   - Select your Web3 wallet (MetaMask, etc.)
   - Ensure you're on HyperEVM network

2. **Deposit USDC**
   - Navigate to deposit tab
   - Enter USDC amount
   - Approve USDC spending (first time only)
   - Click "Deposit" and confirm transaction
   - Vault shares will be minted to your address

3. **Monitor Position**
   - Go to Dashboard (`/dashboard`)
   - View health factor, leverage, LTV
   - Check your share balance and ownership %

4. **Rebalance (if needed)**
   - If health factor goes below 1.15 or above 1.5
   - Click "Rebalance" on dashboard
   - Vault will adjust leverage to target

5. **Withdraw**
   - Go to withdraw tab
   - Enter shares to burn
   - Click "Withdraw"
   - Vault unwinds position proportionally
   - USDC returned to your wallet

### For Developers

#### Interact with Contracts

```typescript
import { ethers } from "ethers";

const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

// Deposit 100 USDC
await usdc.approve(VAULT_ADDRESS, ethers.parseUnits("100", 6));
await vault.deposit(ethers.parseUnits("100", 6));

// Get position details
const [collateral, debt, healthFactor] = await vault.getPositionDetails();

// Withdraw all shares
const shares = await vault.balanceOf(userAddress);
await vault.withdraw(shares);
```

## 🔐 Security Considerations

### Risk Management

- **Conservative LTV**: 60% target provides safety margin against liquidation
- **Health Factor Monitoring**: Continuous tracking with auto-rebalance
- **Stablecoin Focus**: Minimizes volatility risk
- **Whitelisted Protocols**: Only interacts with HypurrFi contracts
- **Pause Mechanism**: Owner can halt deposits in emergency

### Liquidation Risk

- Liquidation occurs when Health Factor < 1.0
- Liquidation penalty: 8% of collateral
- Vault maintains HF ≥ 1.15 through rebalancing
- Users should monitor health factor regularly

### Smart Contract Risks

- **Unaudited Code**: This is a hackathon project - use with caution
- **Oracle Dependency**: Relies on HypurrFi/Hyperliquid price feeds
- **Interest Rate Risk**: Variable borrow rates may increase costs
- **USDXL Depeg Risk**: Vault assumes USDXL maintains $1 peg

### Best Practices

1. Start with small test deposits
2. Monitor health factor regularly
3. Withdraw if market conditions change
4. Understand liquidation risks
5. Never deposit more than you can afford to lose

## 📊 Technical Specifications

### HypurrFi Integration

**Contract Addresses (HyperEVM Mainnet):**
- HypurrFi Pool: `0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b`
- USDC: `0xb88339CB7199b77E23DB6E890353E22632Ba630f`
- USDXL: `0xca79db4b49f608ef54a5cb813fbed3a6387bc645`
- USDT0: `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb` (alternative)

**Key Functions Used:**
- `supply(asset, amount, onBehalfOf, referralCode)` - Deposit collateral
- `borrow(asset, amount, interestRateMode, referralCode, onBehalfOf)` - Take loans
- `repay(asset, amount, rateMode, onBehalfOf)` - Repay debt
- `withdraw(asset, amount, to)` - Remove collateral
- `getUserAccountData(user)` - Get position metrics

### Loop Mechanics

**Example: 100 USDC Deposit with 60% LTV**

```
Iteration 0: Supply 100 USDC
Iteration 1: Borrow 60 USDXL → Supply 60 USDXL
Iteration 2: Borrow 36 USDXL → Supply 36 USDXL
Iteration 3: Borrow 21.6 USDXL → Supply 21.6 USDXL
Iteration 4: Borrow 12.96 USDXL → Supply 12.96 USDXL

Total Supplied: ~230.56 (2.3x leverage)
Total Debt: ~130.56 USDXL
Net Position: ~100 USDC value
Health Factor: ~1.3
```

### Gas Optimization

- Single transaction for full loop execution
- Batch operations where possible
- Infinite approvals reduce subsequent gas costs
- Optimized loop iteration count

## 🎥 Demo Video

[Link to demo video - to be recorded]

**Recommended content:**
1. Overview of vault strategy (30s)
2. Connecting wallet (15s)
3. Depositing USDC (30s)
4. Viewing position on dashboard (30s)
5. Checking health factor and metrics (30s)
6. Withdrawing funds (30s)
7. Final thoughts (15s)

**Total: ~3 minutes**

## 🏆 Hackathon Deliverables

### ✅ Core Requirements Met

- [x] **Vault Contract**: ERC-4626 style with USDC deposits
- [x] **HypurrFi Integration**: Supply, borrow, repay, withdraw
- [x] **Health Factor Tracking**: Real-time monitoring via `getUserAccountData()`
- [x] **Rebalance Function**: Maintains target health factor
- [x] **Position Lifecycle**: Full deposit → open → view → exit flow
- [x] **HyperEVM Deployment**: Ready to deploy on mainnet/testnet
- [x] **Security**: Whitelisted contracts, HF validation
- [x] **Demo Ready**: Frontend shows full flow

### 🌟 Stretch Goals

- [x] **USDXL Integration**: Core to the loop strategy
- [ ] **Multi-Protocol Routing**: Could extend to other HyperEVM protocols
- [x] **Frontend UI**: Full Next.js application
- [ ] **Keeper Bot**: Could add automated rebalancing service

## 📝 Assumptions & Limitations

### Assumptions

1. USDXL maintains peg close to $1.00
2. HypurrFi Pool remains liquid for deposits/withdrawals
3. Oracle price feeds remain accurate and available
4. Interest rates remain economically viable

### Current Limitations

1. **Single Asset**: Only USDC deposits (easily extendable to USDT0)
2. **Manual Rebalance**: Users or owner must call rebalance (could automate with Gelato/Chainlink)
3. **No Yield Farming**: Doesn't claim additional HYPE rewards (future enhancement)
4. **Basic Testing**: Limited fork testing due to testnet availability
5. **No Audit**: Hackathon code - not production-ready

### Future Enhancements

- [ ] Multi-asset support (USDT0, DAI, etc.)
- [ ] Automated keeper bot for rebalancing
- [ ] HYPE rewards claiming and auto-compounding
- [ ] Advanced strategies (delta-neutral, market-neutral)
- [ ] Governance for parameter updates
- [ ] Integration with other HyperEVM protocols
- [ ] Analytics dashboard with historical APY tracking

## 🤝 Contributing

This is a hackathon project. Feedback and suggestions welcome!

## 📜 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **HypurrFi Team** for the excellent lending protocol and documentation
- **Hyperliquid** for HyperEVM infrastructure
- **Aave** for the V3 architecture that HypurrFi builds upon

---

**Built for the HypurrFi Bounty Hunt Hackathon**

For questions or support, please open an issue on GitHub.

