import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

transaction(escrowId: UInt64) {
    prepare(signer: &Account) {}

    execute {
        FreelanceEscrow.acceptEscrow(id: escrowId, freelancer: self.account.address)
    }
}
