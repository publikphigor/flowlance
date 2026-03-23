import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

access(all) fun main(id: UInt64): FreelanceEscrow.EscrowData? {
    return FreelanceEscrow.getEscrow(id: id)
}
