import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

transaction(escrowId: UInt64) {
    prepare(signer: &Account) {}

    execute {
        FreelanceEscrow.releasePayment(id: escrowId, client: self.account.address)
    }
}
