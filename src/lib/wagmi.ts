import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { customChain } from "./chain";

export const config = createConfig({
  chains: [customChain],

  connectors: [
    injected(),
  ],

  transports: {
    [customChain.id]: http(),
  },
});
