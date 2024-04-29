import { expect } from 'chai'
import config from '../../src/config/config'
import { AssetMapper, NetworkNameOnCircuit } from '../../src'
import { ethers } from 'ethers'

describe('AssetMapper', () => {
  const assetMapper = AssetMapper.getInstance(config)
  let networkId: NetworkNameOnCircuit
  let assetAddress: string
  let assetNumber: number

  beforeEach(() => {
    networkId = 'ethm'
    assetAddress = '0x4200000000000000000000000000000000000042'
    assetNumber = 3333 // TRN
  })

  describe('mapAssetByAddress', () => {
    it('should throw an error when mapping a non-existing network', () => {
      networkId = 'ethsss' as NetworkNameOnCircuit
      assetAddress = '0xdoesnotmatter'

      expect(() => assetMapper.mapAssetByAddress(networkId, assetAddress)).to.throw(
        '🍑🚨 Network name on Circuit not mapped to price provider',
      )
    })

    it('should throw an error when mapping a non-existing asset address', () => {
      assetAddress = '0xnonexistentaddress'

      expect(() => assetMapper.mapAssetByAddress(networkId, assetAddress)).to.throw(
        '🍑🚨 Asset address does not match any addresses in the network config',
      )
    })

    it('should map "optimism" asset address to its name on "opsp"', () => {
      networkId = 'opsp'
      assetAddress = ethers.constants.AddressZero
      // const expectedAssetName = 'optimism'
      const expectedAssetName = 'eth' // Actually use ETH for now, cuz it's mapped like that in the configs

      expect(assetMapper.mapAssetByAddress(networkId, assetAddress)).to.equal(expectedAssetName)
    })
  })

  describe('mapAssetByCircuitAssetNumber', () => {
    it('should throw an error when mapping a non-existing network', () => {
      networkId = 'ethsss' as NetworkNameOnCircuit

      expect(() => assetMapper.mapAssetByCircuitNumber(networkId, assetNumber)).to.throw(
        '🍑🚨 Network name on Circuit not mapped to price provider',
      )
    })

    it('should throw an error when mapping a non-existing asset number', () => {
      assetNumber = 123

      expect(() => assetMapper.mapAssetByCircuitNumber(networkId, assetNumber)).to.throw(
        '🍑🚨 Asset number not mapped to a known asset name',
      )
    })

    it('should throw an error when mapping an existing asset number which does not map to any asset in the given network', () => {
      assetNumber = 199 // FIL asset number on Circuit, but not present in `eth` network config

      expect(() => assetMapper.mapAssetByCircuitNumber(networkId, assetNumber)).to.throw(
        '🍑🚨 Asset number does not match any assets in the network config',
      )
    })

    it(`should map 3333 asset number to its corresponding address on ethm`, () => {
      const expectedAssetAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'

      expect(assetMapper.mapAssetByCircuitNumber(networkId, assetNumber)).to.equal(expectedAssetAddress)
    })
  })
})
