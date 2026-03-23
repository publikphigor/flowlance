import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

transaction(freelancer: Address, title: String, amount: UFix64, deadline: UFix64?) {
    prepare(signer: &Account) {}

    execute {
        FreelanceEscrow.createEscrow(
            client: self.account.address,
            freelancer: freelancer,
            title: title,
            amount: amount,
            deadline: deadline
        )
    }
}
