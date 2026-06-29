import { defineChain } from "viem";

export const customChain = defineChain({
  id: 43113,

  name: "Avax Testnet",

  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },

  rpcUrls: {
    default: {
      http: [
        "https://api.avax-test.network/ext/bc/C/rpc"
      ],
    },

    public: {
      http: [
        "https://api.avax-test.network/ext/bc/C/rpc"
      ],
    },
  },

  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://testnet.avascan.info",
    },
  },
});