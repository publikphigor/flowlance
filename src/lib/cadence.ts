import { CONTRACT_ADDRESS } from "./flow";

const FLOW_TOKEN_ADDRESS = import.meta.env.VITE_FLOWTOKEN_ADDRESS ?? "0x0ae53cb6e3f42a79";
const FT_ADDRESS = import.meta.env.VITE_FT_ADDRESS ?? "0xee82856bf20e2aa6";

// ── Scripts ──

export const GET_ALL_ESCROWS = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

access(all) fun main(): [FreelanceEscrow.EscrowData] {
  return FreelanceEscrow.getAllEscrows()
}
`;

export const GET_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

access(all) fun main(id: UInt64): FreelanceEscrow.EscrowData? {
  return FreelanceEscrow.getEscrow(id: id)
}
`;

// ── Transactions ──

export const CREATE_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(freelancer: Address, title: String, description: String, amount: UFix64, deadline: UFix64?, milestoneTitles: [String], milestoneAmounts: [UFix64]) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.createEscrow(
      client: self.signerAddress,
      freelancer: freelancer,
      title: title,
      description: description,
      amount: amount,
      deadline: deadline,
      milestoneTitles: milestoneTitles,
      milestoneAmounts: milestoneAmounts
    )
  }
}
`;

export const UPDATE_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64, title: String, description: String, amount: UFix64, deadline: UFix64?, milestoneTitles: [String], milestoneAmounts: [UFix64]) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.updateEscrow(
      id: escrowId,
      client: self.signerAddress,
      title: title,
      description: description,
      amount: amount,
      deadline: deadline,
      milestoneTitles: milestoneTitles,
      milestoneAmounts: milestoneAmounts
    )
  }
}
`;

export const FUND_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}
import FungibleToken from ${FT_ADDRESS}
import FlowToken from ${FLOW_TOKEN_ADDRESS}

transaction(escrowId: UInt64) {
  let vault: @FlowToken.Vault

  prepare(signer: auth(Storage) &Account) {
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow vault reference")

    let escrow = FreelanceEscrow.getEscrow(id: escrowId)
      ?? panic("Escrow not found")

    self.vault <- vaultRef.withdraw(amount: escrow.amount) as! @FlowToken.Vault
  }

  execute {
    FreelanceEscrow.fundEscrow(id: escrowId, vault: <-self.vault)
  }
}
`;

export const ACCEPT_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.acceptEscrow(id: escrowId, freelancer: self.signerAddress)
  }
}
`;

export const START_WORK = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.startWork(id: escrowId, freelancer: self.signerAddress)
  }
}
`;

export const COMPLETE_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64, deliverableURI: String) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.completeEscrow(id: escrowId, freelancer: self.signerAddress, deliverableURI: deliverableURI)
  }
}
`;

export const CONFIRM_COMPLETION = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.confirmCompletion(id: escrowId, client: self.signerAddress)
  }
}
`;

export const COMPLETE_MILESTONE = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64, milestoneId: UInt64) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.completeMilestone(id: escrowId, milestoneId: milestoneId, freelancer: self.signerAddress)
  }
}
`;

export const CONFIRM_MILESTONE = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64, milestoneId: UInt64) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.confirmMilestone(id: escrowId, milestoneId: milestoneId, client: self.signerAddress)
  }
}
`;

export const CANCEL_ESCROW = `
import FreelanceEscrow from ${CONTRACT_ADDRESS}

transaction(escrowId: UInt64) {
  let signerAddress: Address

  prepare(signer: auth(Storage) &Account) {
    self.signerAddress = signer.address
  }

  execute {
    FreelanceEscrow.cancelEscrow(id: escrowId, caller: self.signerAddress)
  }
}
`;
