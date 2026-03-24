# FlowLance — Freelance Escrow on Flow

A lightweight smart-contract escrow for freelance jobs on the Flow blockchain. Funds are held in a Cadence contract until the freelancer delivers and the client approves — reducing counterparty risk for small online gigs where trust is the main bottleneck.

Built for the **PL_Genesis: Frontiers of Collaboration** hackathon.

## How It Works

1. **Client creates an escrow** — sets the job title, description, amount (FLOW), freelancer address, and optional milestones
2. **Client funds the escrow** — FLOW tokens are locked in the smart contract
3. **Freelancer accepts** — reviews the job and accepts it
4. **Freelancer starts work** — status moves to In Progress
5. **Freelancer delivers** — submits a deliverable link (or marks milestones complete one by one)
6. **Client confirms** — releases payment to the freelancer's wallet (or confirms milestones individually for partial releases)

Either party can cancel before work starts. If the freelancer cancels during work, remaining funds are refunded to the client.

## Features

- On-chain escrow with full state machine (Created → Funded → Pending → In Progress → Completed → Released)
- Optional milestone-based payments with per-milestone confirmation and auto-release
- Role-aware UI — clients and freelancers see different actions based on escrow status
- Wallet connect via FCL (Flow Client Library)
- Editable escrow details (title, description, amount, milestones) before freelancer acceptance
- Cancellation with automatic refund logic
- Formatted amounts, responsive design, access control

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Cadence (Flow) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Wallet/Auth | FCL (Flow Client Library) |
| Fonts | Inter, JetBrains Mono |
| Deployment | Netlify (frontend), Flow Testnet (contract) |

## Project Structure

```
flowlance/
├── contracts/
│   └── FreelanceEscrow.cdc        # Main escrow contract
├── transactions/                   # Cadence transaction files
├── scripts/                        # Cadence read scripts
├── src/
│   ├── components/                 # Layout, EscrowCard, StatusBadge
│   ├── hooks/                      # useAuth, useEscrows
│   ├── lib/                        # FCL config, Cadence templates, types, formatting
│   └── pages/                      # Landing, Dashboard, CreateEscrow, EscrowDetail
├── public/                         # OG image, favicon
├── flow.json.example               # Flow CLI config template (copy to flow.json)
└── netlify.toml                    # Netlify deploy config
```

## Getting Started

### Prerequisites

- Node.js 20+
- [Flow CLI](https://developers.flow.com/tools/flow-cli)

### Local Development

```bash
# Install dependencies
npm install

# Copy flow config and add your keys
cp flow.json.example flow.json

# Start the Flow emulator
flow emulator

# Deploy the contract (in another terminal)
flow project deploy --network=emulator

# Start the dev wallet
flow dev-wallet

# Start the frontend
npm run dev
```

### Testnet Deployment

1. Generate a key pair: `flow keys generate`
2. Create a testnet account at the [Flow Faucet](https://testnet-faucet.onflow.org)
3. Add your testnet account to `flow.json`
4. Deploy: `flow accounts add-contract contracts/FreelanceEscrow.cdc --signer your-account --network testnet`
5. Update `.env.testnet` with your contract address
6. Build and deploy frontend to Netlify

## Smart Contract Security

- Role-based access control on all state transitions
- String length limits (title: 200, description: 2000, URI: 500)
- Max 20 milestones per escrow
- Self-assignment prevention (client cannot be freelancer)
- State updates before external interactions (checks-effects-interactions pattern)
- Cancellation rules enforced per status (client, freelancer, or both depending on state)

### Known Limitations (MVP)

- No arbitration or dispute resolution
- No partial releases outside of milestones
- No protocol fee
- On-chain data is publicly readable (no privacy layer)
- Testnet only — not audited for mainnet use

## License

MIT
