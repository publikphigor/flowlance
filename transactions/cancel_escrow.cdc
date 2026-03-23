import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

transaction(escrowId: UInt64) {
    prepare(signer: &Account) {}

    execute {
        FreelanceEscrow.cancelEscrow(id: escrowId, client: self.account.address)
    }
}
