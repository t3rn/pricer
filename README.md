# Pricer

## Overview
`@t3rn/pricer` provides functionality for retrieving asset prices, evaluating deals, and proposing deals for a given set amount.

## Installation
```bash
npm i @t3rn/pricer --save
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

## Publishing
Follow these steps to publish the package to npm after introducing new features/fixes:

1. Increase the library's version in `package.json`, e.g.: `"version": "1.5.4"`.
2. Run `npm run build`.
3. Commit your changes:
   ```bash
   git add .
   git commit -m "Version X.Y.Z: Description of changes"
   ```
4. Push your changes to your branch:
   ```bash
   git push origin your-branch-name
   ```
5. Merge your changes into the master branch:
   ```bash
   git checkout master
   git pull origin master
   git merge your-branch-name
   ```
6. Publish the package to npm:
   ```bash
   npm publish
   ```

## Documentation
For detailed information on each method and its parameters, refer to the `Pricer` class definition.

## License
This project is licensed under the [MIT License](LICENSE).