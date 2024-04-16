import { BigNumber } from 'ethers';
export interface CostResult {
    costInWei: BigNumber;
    costInEth: string;
    costInUsd: number;
    costInAsset: BigNumber;
    asset: string;
}
export interface PriceResult {
    assetA: string;
    assetB: string;
    priceAinB: BigNumber;
    priceAInUsd: string;
    priceBInUsd: string;
}
export type AssetAddressOnTarget = {
    asset: string;
    address: string;
};
export interface OrderProfitability {
    isProfitable: boolean;
    profit: BigNumber;
    loss: BigNumber;
}
export interface OrderProfitabilityProposal {
    profitability: OrderProfitability;
    assumedCost: CostResult;
    assumedPrice: PriceResult;
    rewardAsset: string;
    orderAsset: string;
    costOverpaymentPercent: number;
}
export interface OrderProfitabilityProposalForSetAmount extends OrderProfitabilityProposal {
    setAmount: BigNumber;
    proposedMaxReward: BigNumber;
}
export interface DealPublishability {
    isPublishable: boolean;
    maxReward: BigNumber;
}
export interface UserPublishStrategy {
    maxSpendLimit?: BigNumber;
    setAmount?: BigNumber;
}
