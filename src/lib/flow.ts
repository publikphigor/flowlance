import * as fcl from "@onflow/fcl";

fcl.config({
  "app.detail.title": "FlowLance Escrow",
  "app.detail.icon": "",
  "accessNode.api": import.meta.env.VITE_FLOW_ACCESS_NODE ?? "http://localhost:8888",
  "discovery.wallet": import.meta.env.VITE_FLOW_WALLET_DISCOVERY ?? "http://localhost:8701/fcl/authn",
  "flow.network": import.meta.env.VITE_FLOW_NETWORK ?? "emulator",
});

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "0xf8d6e0586b0a20c7";

export { fcl };
