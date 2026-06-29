import React from "react";
import ReactDOM from "react-dom/client";

import { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider } from "wagmi";
import { Toaster } from "sonner";

import { config } from "./lib/wagmi";

import App from "./App";

import "./index.css";
import "./App.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
