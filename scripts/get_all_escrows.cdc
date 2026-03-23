import FreelanceEscrow from "../contracts/FreelanceEscrow.cdc"

access(all) fun main(): [FreelanceEscrow.EscrowData] {
    return FreelanceEscrow.getAllEscrows()
}
