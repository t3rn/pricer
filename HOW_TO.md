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

#### Mapping meaning
Example:
```env
 arbitrum: [
    {
      asset: 'arbitrum',
      address: ethers.constants.AddressZero,
    },
    //wETH
    {
      asset: 'eth',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    ...
 ]
```

Key 'arbitrum' is the chain name that ankr supports.  
Key 'asset' is the asset name that ankr supports.  
Key 'address' is the token's address found on the blockchain explorer.  

**How do i find the token address?**  
If for example we want to find eth's address on arbitrum, google arbitrum explorer and then inside it search for ETH.  
That will bring up the native/ERC20 token and its address.  

#### Unsupported chain
The ankr provider does not have a great list of supported chains. Until we find and switch to a better provider, follow these steps:
When we have an unsupported chain, we should do our best to assign it to a similar and supported chain:
blss: 'base',

Here blss (blast) won't be supported by ankr but we make sure the pricer will return something by using 'base' instead.

#### Address zero
In 'networkToAssetAddressOnPriceProviderMap' mapping we use address zero to represent native tokens on each network.
In order to fetch a native token price from ankr, we cannot pass address zero as it is not supported, only the network name is required.
Our proxy server knows to not add address zero to the provider request, therefore we will still get the price.

#### Token addresses
When you add new tokens for new/existing supported networks, make sure to first check their existence/support against the ankr provider api.

cURL example:
```env
curl --location 'https://rpc.ankr.com/multichain/OUR_API_KEY_HERE' \
--header 'Content-Type: application/json' \
--data '{
    "method": "ankr_getTokenPrice",
    "params": {
        "blockchain": "arbitrum",
        "contractAddress": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
    },
    "id": 1,
    "jsonrpc": "2.0"
}'
```

Want to query a chain's native token with address zero? Simply remove 'contractAddress' param, pass just the 'blockchain' value.

Did ankr not respond with the correct price or returned price 0? **DO NOT ADD IT** or find a similar token address, for example: TRN = USDT address