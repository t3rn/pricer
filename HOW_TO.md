# HOW TO

## Why don't we support ankr.js and use the getSupportedTokens from there?
pricer is also used in frontend and ankr.js used grpc.
Security one browser was closing the connection and we had to strip ankr.js out.

## This document will present you an overview of how to work with the pricer library


### How do I add support for a new network?
This pricer library fetches tokens usd prices from our rust proxy server which calls ankr provider to retrieve prices.
This provider only supports these networks:
```env
arbitrum, avalanche, base, bsc, eth, fantom, flare, gnosis, linea, optimism, polygon, polygon_zkevm, rollux, scroll, syscoin, avalanche_fuji, polygon_mumbai
```

So when you want to add a new network, you modify the networkNameCircuitToPriceProvider mapping found in src/config/circuit-assets.ts by adding the new network id coming from guardian and the matching supporting chain. 

Example: opsp: 'optimism'

Where opsp is the incoming chain id from guardian and 'optimism' is the supported ankr chain

#### Unsupported chain
The ankr provider does not have a great list of supported chains. Until we find and switch to a better provider, follow these steps:
When we have an unsupported chain, we should do our best to assign it to a similar and supported chain:
blss: 'base',

Here blss (blast) won't be supported by ankr but we make sure the pricer will return something by assigning it to 'base'