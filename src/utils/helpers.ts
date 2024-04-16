import { SupportedAssetPriceProvider } from '../config/price-provider-assets'
import { assetNameCircuitToPriceProvider } from '../config/circuit-assets'

export function mapSymbolToCurrency(asset: number): string {
  const priceProvider = assetNameCircuitToPriceProvider[asset]
  return SupportedAssetPriceProvider[
    priceProvider.toUpperCase() as unknown as keyof typeof SupportedAssetPriceProvider
  ].toUpperCase()
}
