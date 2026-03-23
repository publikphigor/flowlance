import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"
import FlowToken from "FlowToken"

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
