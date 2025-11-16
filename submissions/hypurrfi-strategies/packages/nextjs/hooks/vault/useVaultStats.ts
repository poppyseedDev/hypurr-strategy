import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/**
 * Custom hook to fetch vault-wide statistics
 * @returns Vault statistics including TVL, metrics, and health factor
 */
export const useVaultStats = () => {
  // Fetch total vault assets (TVL)
  const { data: tvl, isLoading: tvlLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "totalAssets",
    watch: true,
  });

  // Fetch total supply of shares
  const { data: totalShares, isLoading: sharesLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "totalSupply",
    watch: true,
  });

  // Fetch vault metrics (includes TVL, shares, exchange rate, and health factor)
  const { data: vaultMetrics, isLoading: metricsLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "getVaultMetrics",
    watch: true,
  });

  // Fetch position details for leverage calculation
  const { data: positionDetails, isLoading: positionLoading } = useScaffoldReadContract({
    contractName: "HypurrFiVault",
    functionName: "getPositionDetails",
    watch: true,
  });

  // Calculate exchange rate (assets per share)
  const exchangeRate = useMemo(() => {
    if (!vaultMetrics) return 0n;
    return vaultMetrics[2]; // exchangeRate is the 3rd element
  }, [vaultMetrics]);

  // Extract current health factor from vault metrics
  const currentHealthFactor = useMemo(() => {
    if (!vaultMetrics) return 0n;
    return vaultMetrics[3]; // currentHealthFactor is the 4th element
  }, [vaultMetrics]);

  // Calculate leverage ratio from position details
  const leverageRatio = useMemo(() => {
    if (!positionDetails) return 0n;
    const totalCollateral = positionDetails[0];
    const totalDebt = positionDetails[1];
    if (totalCollateral === 0n) return 0n;
    // Leverage = (Collateral + Debt) / Collateral
    return ((totalCollateral + totalDebt) * BigInt(1e18)) / totalCollateral;
  }, [positionDetails]);

  // Calculate leverage as a decimal (for display)
  const leverageMultiplier = useMemo(() => {
    if (!leverageRatio) return 0;
    return Number(leverageRatio) / 1e18;
  }, [leverageRatio]);

  // Calculate utilization rate from position details
  const utilizationRate = useMemo(() => {
    if (!positionDetails) return 0n;
    const totalCollateral = positionDetails[0];
    const totalDebt = positionDetails[1];
    if (totalCollateral === 0n) return 0n;
    // Utilization = Debt / Collateral * 10000 (basis points)
    return (totalDebt * BigInt(10000)) / totalCollateral;
  }, [positionDetails]);

  // Calculate utilization as a percentage
  const utilizationPercentage = useMemo(() => {
    if (!utilizationRate) return 0;
    return Number(utilizationRate) / 100; // Convert from basis points to percentage
  }, [utilizationRate]);

  const isLoading = tvlLoading || sharesLoading || metricsLoading || positionLoading;

  return {
    tvl: tvl || 0n,
    // Note: APY calculation would require historical data or additional contract methods
    // Commenting out for now since getCurrentAPY doesn't exist in the contract
    // apy: 0n,
    // apyPercentage: 0,
    leverage: leverageRatio,
    leverageMultiplier,
    utilizationRate,
    utilizationPercentage,
    totalShares: totalShares || 0n,
    exchangeRate,
    currentHealthFactor,
    // Note: isRebalanceNeeded would need to be calculated client-side or added to contract
    // isRebalanceNeeded: false,
    isLoading,
  };
};
