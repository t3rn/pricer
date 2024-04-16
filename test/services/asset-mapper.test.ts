import { expect } from 'chai'
import config from '../../src/config/config'
import { AssetMapper, NetworkNameOnCircuit } from '../../src'

describe.only('AssetMapper', () => {
  const assetMapper = AssetMapper.getInstance(config)
  let networkId: NetworkNameOnCircuit

  beforeEach(() => {
    networkId = 'ethm'
  })

  it('should throw an error when mapping a non-existing network', () => {
    networkId = 'ethsss' as NetworkNameOnCircuit
    const assetAddress = '0xdoesnotmatter'

    expect(() => assetMapper.mapAssetByAddress(networkId, assetAddress)).to.throw(
      '🍑🚨 Network name on Circuit not mapped to price provider',
    )
  })

  it('should throw an error when mapping a non-existing asset address', () => {
    const assetAddress = '0xnonexistentaddress'

    expect(() => assetMapper.mapAssetByAddress(networkId, assetAddress)).to.throw(
      '🍑🚨 Asset address does not match any addresses in the provided mapping',
    )
  })

  it('should map an existing asset address to its corresponding asset name', () => {
    const assetAddress = '0x4200000000000000000000000000000000000042'
    const expectedAssetName = 'optimism'

    expect(assetMapper.mapAssetByAddress(networkId, assetAddress)).to.equal(expectedAssetName)
  })
})
