# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scaffold-ETH 2 is a toolkit for building decentralized applications (dapps) on Ethereum. Built with NextJS, RainbowKit, Hardhat, Wagmi, Viem, and TypeScript.

This is a yarn monorepo with two main packages:
- `packages/hardhat`: Solidity smart contracts with Hardhat framework
- `packages/nextjs`: Next.js frontend (using App Router) with web3 utilities

## Development Workflow

### Starting the Development Environment

1. **Start local blockchain**: `yarn chain`
   - Runs Hardhat network locally
   - Default network config in `packages/hardhat/hardhat.config.ts`

2. **Deploy contracts**: `yarn deploy`
   - Deploys contracts from `packages/hardhat/contracts`
   - Uses deploy scripts in `packages/hardhat/deploy`
   - Automatically generates TypeScript ABIs after deployment

3. **Start frontend**: `yarn start`
   - Runs Next.js dev server at `http://localhost:3000`
   - Auto-reloads when contracts change (hot reload)
   - Visit `/debug` to interact with contracts via UI

### Common Commands

**Smart Contracts:**
- `yarn compile` - Compile Solidity contracts
- `yarn hardhat:test` - Run contract tests
- `yarn hardhat:clean` - Clean build artifacts
- `yarn fork` - Fork mainnet (set `MAINNET_FORKING_ENABLED=true`)
- `yarn hardhat:verify` - Verify contracts on Etherscan
- `yarn generate` or `yarn account:generate` - Generate new account

**Frontend:**
- `yarn next:build` - Production build
- `yarn next:lint` - Lint Next.js code
- `yarn next:format` - Format Next.js code
- `yarn vercel` - Deploy to Vercel
- `yarn ipfs` - Build and upload to IPFS

**Both:**
- `yarn format` - Format all code (Next.js + Hardhat)
- `yarn lint` - Lint all code

## Architecture

### Smart Contract Layer (`packages/hardhat`)

**Key Files:**
- `hardhat.config.ts` - Network configs, compiler settings, plugins
- `contracts/` - Solidity smart contracts
- `deploy/` - Deployment scripts (numbered, e.g., `01_deploy_se2_token.ts`)
- `test/` - Contract tests
- `scripts/` - Utility scripts (account management, etc.)

**Deploy Task Extension:**
The `deploy` task automatically runs `generateTsAbis` after deployment to sync ABIs with the frontend.

**Supported Networks:**
Pre-configured: mainnet, sepolia, arbitrum, arbitrumSepolia, optimism, optimismSepolia, polygon, polygonAmoy, polygonZkEvm, polygonZkEvmCardona, gnosis, chiado, base, baseSepolia, scrollSepolia, scroll, celo, celoSepolia.

### Frontend Layer (`packages/nextjs`)

**Key Files:**
- `scaffold.config.ts` - Network settings, API keys, wallet config
- `app/` - Next.js App Router pages
- `components/scaffold-eth/` - Web3 UI components
- `hooks/scaffold-eth/` - Custom React hooks for contract interaction
- `contracts/` - Contains `deployedContracts.ts` and `externalContracts.ts`
- `services/` - Web3 services
- `utils/` - Utility functions

**Configuration (`scaffold.config.ts`):**
- `targetNetworks` - Which networks the dapp supports (default: `[chains.hardhat]`)
- `pollingInterval` - RPC polling frequency
- `alchemyApiKey` - For RPC connections
- `onlyLocalBurnerWallet` - Restrict to local burner wallet

### Contract Interaction Patterns

**ALWAYS use these hooks - never use other patterns:**

**Reading from contracts:**
```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const { data: someData } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "functionName",
  args: [arg1, arg2], // optional
});
```

**Writing to contracts:**
```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract",
});

await writeContractAsync({
  functionName: "functionName",
  args: [arg1, arg2], // optional
  value: parseEther("0.1"), // optional, for payable functions
});
```

**Reading contract events:**
```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const { data: events, isLoading, error } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "EventName",
  watch: true, // optional, watches for new events
});
```

**Other available hooks:**
- `useScaffoldWatchContractEvent` - Watch for specific events
- `useDeployedContractInfo` - Get deployed contract info
- `useScaffoldContract` - Get contract instance
- `useTransactor` - Wrap transactions with notifications

All hooks are in `packages/nextjs/hooks/scaffold-eth/`.

### UI Components

**Always use these components for web3 data:**

- `<Address address={...} />` - Display Ethereum addresses
- `<AddressInput value={...} onChange={...} />` - Input for addresses
- `<Balance address={...} />` - Display ETH/token balance
- `<EtherInput value={...} onChange={...} />` - Input for ETH amounts with USD conversion

Components are in `packages/nextjs/components/scaffold-eth/`.

### Contract Data Source

The frontend reads contract ABIs and addresses from:
- `packages/nextjs/contracts/deployedContracts.ts` - Auto-generated from deployments
- `packages/nextjs/contracts/externalContracts.ts` - Manually added external contracts

## Key Features

- **Contract Hot Reload**: Frontend auto-updates when contracts change
- **Burner Wallet**: Local wallet for testing (configurable in `scaffold.config.ts`)
- **Debug UI**: Visit `/debug` to interact with all deployed contracts
- **Block Explorer**: Built-in block explorer at `/blockexplorer`

## Environment Variables

**Hardhat (`.env` in `packages/hardhat/`):**
- `ALCHEMY_API_KEY` - Alchemy API key (has default)
- `__RUNTIME_DEPLOYER_PRIVATE_KEY` - Deployer private key (has default)
- `ETHERSCAN_V2_API_KEY` - Etherscan API key (has default)

**Next.js (`.env.local` in `packages/nextjs/`):**
- `NEXT_PUBLIC_ALCHEMY_API_KEY` - Frontend Alchemy key
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID

## Testing

Smart contract tests go in `packages/hardhat/test/`. Run with:
```bash
yarn hardhat:test
# or from root
yarn test
```

## Deployment

**To live networks:**
1. Set target network in `packages/hardhat/hardhat.config.ts`
2. Configure private key via `__RUNTIME_DEPLOYER_PRIVATE_KEY` env var
3. Run `yarn deploy --network <network-name>`

**Frontend deployment:**
- Vercel: `yarn vercel`
- IPFS: `yarn ipfs`

Update `targetNetworks` in `packages/nextjs/scaffold.config.ts` to match deployment network.

## Package Manager

Uses Yarn 3.2.3. Requires Node >= v20.18.3.
