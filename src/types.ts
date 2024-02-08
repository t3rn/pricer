import { BigNumber } from 'ethers'
import { NetworkNameOnCircuit } from './config/circuit-assets'
export interface Order {
    id: string
    source: NetworkNameOnCircuit
    destination: NetworkNameOnCircuit
    asset: number
    assetAddress: string
    assetNative: boolean
    targetAccount: string
    amount: BigNumber
    rewardAsset: string
    insurance: BigNumber
    maxReward: BigNumber
    nonce: number
    txHash: string
}