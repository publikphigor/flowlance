import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

transaction(escrowId: UInt64, deliverableURI: String) {
    prepare(signer: &Account) {}

    execute {
        FreelanceEscrow.markDelivered(id: escrowId, freelancer: self.account.address, deliverableURI: deliverableURI)
    }
}
