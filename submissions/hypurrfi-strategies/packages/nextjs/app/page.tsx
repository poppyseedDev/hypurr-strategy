"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { ArrowTrendingUpIcon, BuildingLibraryIcon, ChartBarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  // Fetch vault stats for the hero section
  const { data: totalAssets } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "totalAssets",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "totalSupply",
  });

  return (
    <>
      <div className="flex items-center flex-col grow">
        {/* Hero Section */}
        <div className="w-full gradient-bg-subtle py-20 px-5">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Automated Leverage Loops</span>
              <br />
              <span className="text-base-content">on HyperEVM</span>
            </h1>
            <p className="text-xl md:text-2xl text-base-content/70 mb-8 max-w-3xl mx-auto">
              One-click leveraged yields with automated position management and built-in risk controls. Powered by
              HypurrFi lending markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/vault" className="btn btn-primary btn-lg gap-2">
                <BuildingLibraryIcon className="h-6 w-6" />
                Launch Vault
              </Link>
              <a
                href="https://docs.hypurr.fi"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-lg gap-2"
              >
                Read Docs
              </a>
            </div>

            {/* Live Stats */}
            {(totalAssets || totalSupply) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-base-100 rounded-2xl p-6 shadow-lg card-hover">
                  <div className="text-3xl font-bold text-primary">
                    {totalAssets ? `${formatUnits(totalAssets, 6)} USDC` : "0"}
                  </div>
                  <div className="text-sm text-base-content/70 mt-2">Total Value Locked</div>
                </div>
                <div className="bg-base-100 rounded-2xl p-6 shadow-lg card-hover">
                  <div className="text-3xl font-bold text-success">3.2x</div>
                  <div className="text-sm text-base-content/70 mt-2">Average Leverage</div>
                </div>
                <div className="bg-base-100 rounded-2xl p-6 shadow-lg card-hover">
                  <div className="text-3xl font-bold text-accent">
                    {totalSupply ? Math.floor(Number(totalSupply) / 1e18) : "0"}
                  </div>
                  <div className="text-sm text-base-content/70 mt-2">Active Positions</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full py-20 px-5 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">
              <span className="gradient-text">Why HypurrFi?</span>
            </h2>
            <p className="text-center text-base-content/70 mb-12 text-lg">
              Automated leverage strategies built on HypurrFi&apos;s pooled lending markets
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-base-200 rounded-2xl p-8 shadow-lg card-hover">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">One-Click Leverage</h3>
                <p className="text-base-content/70">
                  Deposit USDC and automatically enter a leveraged position. No manual looping, no complexity. Just
                  deposit and earn.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-base-200 rounded-2xl p-8 shadow-lg card-hover">
                <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheckIcon className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Risk Management</h3>
                <p className="text-base-content/70">
                  Built-in health factor monitoring and automatic rebalancing. Your position is protected from
                  liquidation with smart safeguards.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-base-200 rounded-2xl p-8 shadow-lg card-hover">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <ChartBarIcon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">ERC-4626 Standard</h3>
                <p className="text-base-content/70">
                  Fully compatible with yield aggregators and DeFi composability. Your vault shares are liquid and
                  transferable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="w-full py-20 px-5 gradient-bg-subtle">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-center text-base-content/70 mb-16 text-lg">
              Simple 4-step process to start earning leveraged yields
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-primary text-primary-content w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Deposit USDC</h3>
                <p className="text-base-content/70">Connect your wallet and deposit USDC into the vault</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-secondary text-secondary-content w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Auto Loop</h3>
                <p className="text-base-content/70">Vault automatically creates a leveraged position on HypurrFi</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-accent text-accent-content w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Earn Yield</h3>
                <p className="text-base-content/70">Your position earns amplified yields on deposited collateral</p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="bg-success text-success-content w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3">Withdraw</h3>
                <p className="text-base-content/70">Exit anytime - vault unwinds position and returns your assets</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full py-20 px-5 bg-base-100">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Earning?</h2>
            <p className="text-xl text-base-content/70 mb-8">Join the future of leveraged DeFi on HyperEVM</p>
            <Link href="/vault" className="btn btn-primary btn-lg gap-2">
              <BuildingLibraryIcon className="h-6 w-6" />
              Launch Vault Now
            </Link>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="w-full py-12 px-5 bg-warning/10 border-t border-warning/30">
          <div className="max-w-4xl mx-auto">
            <div className="alert alert-warning shadow-lg">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold">Risk Disclaimer</h3>
                  <div className="text-sm">
                    Leveraged positions carry inherent risks including potential for liquidation. This is experimental
                    software on testnet. Only use funds you can afford to lose. Read the{" "}
                    <a href="https://docs.hypurr.fi" target="_blank" rel="noreferrer" className="link font-bold">
                      documentation
                    </a>{" "}
                    before depositing.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
