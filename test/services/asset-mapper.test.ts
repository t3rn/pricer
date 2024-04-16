import { expect } from 'chai'
import config from '../../src/config/config'
import { AssetMapper } from '../../src'

describe.only('AssetMapper', () => {
  it('should map an existing asset address to its corresponding asset name', () => {
    const assetMapper = AssetMapper.getInstance(config)

    const targetNetworkId = 'ethm'
    const assetAddress = '0x4200000000000000000000000000000000000006'
    const expectedAssetName = 'arbitrum'

    expect(assetMapper.mapAssetByAddress(targetNetworkId, assetAddress)).to.equal(expectedAssetName)
  })

  it('should throw an error when mapping a non-existing asset address', () => {
    const assetMapper = AssetMapper.getInstance(config)

    const targetNetworkId = 'ethm'
    const assetAddress = '0xnonexistentaddress'

    expect(() => assetMapper.mapAssetByAddress(targetNetworkId, assetAddress)).to.throw()
  })

  // Add more test cases as needed to cover different scenarios
})
