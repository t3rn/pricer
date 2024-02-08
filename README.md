# Pricer

## Overview
`@t3rn/pricer` provides functionality for retrieving asset prices, evaluating deals, and proposing deals for a given set amount.

## Installation
```bash
npm i @t3rn/pricer
```

or

```bash
pnpm add npm i @t3rn/pricer
```

## Usage
```ts
const pricer = new Pricer(config)
...
const assetValueUSD = await pricer.receiveAssetUSDValue(
    assetNamePriceProvider,
    networkNamePriceProvider,
    order.maxReward,
)
```

## Documentation
For detailed information on each method and its parameters, refer to the `Pricer` class definition.

## License
This project is licensed under the [MIT License](LICENSE).