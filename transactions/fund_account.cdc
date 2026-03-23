import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79

transaction(recipient: Address, amount: UFix64) {
  let sentVault: @FlowToken.Vault
  prepare(signer: auth(Storage) &Account) {
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
      ?? panic("Could not borrow vault")
    self.sentVault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
  }
  execute {
    let receiverRef = getAccount(recipient).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      ?? panic("Could not borrow receiver")
    receiverRef.deposit(from: <-self.sentVault)
  }
}
