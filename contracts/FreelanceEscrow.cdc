import "FungibleToken"
import "FlowToken"

access(all) contract FreelanceEscrow {

    // ── Status Enum ──
    access(all) enum Status: UInt8 {
        access(all) case Created    // 0 - job posted, not funded
        access(all) case Funded     // 1 - money locked in contract
        access(all) case Pending    // 2 - freelancer accepted, not started
        access(all) case InProgress // 3 - freelancer started working
        access(all) case Completed  // 4 - freelancer marked whole job complete (non-milestone only)
        access(all) case Released   // 5 - all funds sent to freelancer
        access(all) case Cancelled  // 6 - cancelled, funds refunded to client
    }

    // ── Milestone Status Enum ──
    access(all) enum MilestoneStatus: UInt8 {
        access(all) case Pending   // 0
        access(all) case Completed // 1
        access(all) case Released  // 2
    }

    // ── Milestone Struct (internal) ──
    access(all) struct Milestone {
        access(all) let id: UInt64
        access(all) let title: String
        access(all) let amount: UFix64
        access(all) var status: MilestoneStatus

        init(id: UInt64, title: String, amount: UFix64) {
            self.id = id
            self.title = title
            self.amount = amount
            self.status = MilestoneStatus.Pending
        }

        access(contract) fun setStatus(_ s: MilestoneStatus) {
            self.status = s
        }
    }

    // ── MilestoneData (returned by scripts) ──
    access(all) struct MilestoneData {
        access(all) let id: UInt64
        access(all) let title: String
        access(all) let amount: UFix64
        access(all) let status: UInt8

        init(id: UInt64, title: String, amount: UFix64, status: UInt8) {
            self.id = id
            self.title = title
            self.amount = amount
            self.status = status
        }
    }

    // ── Escrow Data (returned by scripts) ──
    access(all) struct EscrowData {
        access(all) let id: UInt64
        access(all) let client: Address
        access(all) let freelancer: Address
        access(all) let amount: UFix64
        access(all) let status: UInt8
        access(all) let title: String
        access(all) let description: String
        access(all) let deliverableURI: String?
        access(all) let createdAt: UFix64
        access(all) let deadline: UFix64?
        access(all) let milestones: [MilestoneData]

        init(
            id: UInt64,
            client: Address,
            freelancer: Address,
            amount: UFix64,
            status: UInt8,
            title: String,
            description: String,
            deliverableURI: String?,
            createdAt: UFix64,
            deadline: UFix64?,
            milestones: [MilestoneData]
        ) {
            self.id = id
            self.client = client
            self.freelancer = freelancer
            self.amount = amount
            self.status = status
            self.title = title
            self.description = description
            self.deliverableURI = deliverableURI
            self.createdAt = createdAt
            self.deadline = deadline
            self.milestones = milestones
        }
    }

    // ── Internal Escrow Record ──
    access(all) struct EscrowRecord {
        access(all) let id: UInt64
        access(all) let client: Address
        access(all) let freelancer: Address
        access(all) var amount: UFix64
        access(all) var status: Status
        access(all) var title: String
        access(all) var description: String
        access(all) var deliverableURI: String?
        access(all) let createdAt: UFix64
        access(all) var deadline: UFix64?
        access(all) var milestones: [Milestone]

        init(
            id: UInt64,
            client: Address,
            freelancer: Address,
            amount: UFix64,
            title: String,
            description: String,
            deadline: UFix64?,
            milestones: [Milestone]
        ) {
            self.id = id
            self.client = client
            self.freelancer = freelancer
            self.amount = amount
            self.status = Status.Created
            self.title = title
            self.description = description
            self.deliverableURI = nil
            self.createdAt = getCurrentBlock().timestamp
            self.deadline = deadline
            self.milestones = milestones
        }

        access(all) fun toData(): EscrowData {
            let milestoneDataList: [MilestoneData] = []
            for m in self.milestones {
                milestoneDataList.append(
                    MilestoneData(
                        id: m.id,
                        title: m.title,
                        amount: m.amount,
                        status: m.status.rawValue
                    )
                )
            }
            return EscrowData(
                id: self.id,
                client: self.client,
                freelancer: self.freelancer,
                amount: self.amount,
                status: self.status.rawValue,
                title: self.title,
                description: self.description,
                deliverableURI: self.deliverableURI,
                createdAt: self.createdAt,
                deadline: self.deadline,
                milestones: milestoneDataList
            )
        }

        access(contract) fun setStatus(_ s: Status) {
            self.status = s
        }

        access(contract) fun setDeliverableURI(_ uri: String) {
            self.deliverableURI = uri
        }

        access(contract) fun setTitle(_ title: String) {
            self.title = title
        }

        access(contract) fun setDescription(_ description: String) {
            self.description = description
        }

        access(contract) fun setDeadline(_ deadline: UFix64?) {
            self.deadline = deadline
        }

        access(contract) fun setMilestones(_ milestones: [Milestone]) {
            self.milestones = milestones
        }

        access(contract) fun setAmount(_ amount: UFix64) {
            self.amount = amount
        }

        access(contract) fun setMilestoneStatus(milestoneId: UInt64, status: MilestoneStatus) {
            var i = 0
            while i < self.milestones.length {
                if self.milestones[i].id == milestoneId {
                    self.milestones[i].setStatus(status)
                    return
                }
                i = i + 1
            }
            panic("Milestone not found")
        }
    }

    // ── Events ──
    access(all) event EscrowCreated(id: UInt64, client: Address, freelancer: Address, amount: UFix64, title: String)
    access(all) event EscrowFunded(id: UInt64)
    access(all) event EscrowAccepted(id: UInt64, freelancer: Address)
    access(all) event WorkStarted(id: UInt64)
    access(all) event EscrowCompleted(id: UInt64)
    access(all) event CompletionConfirmed(id: UInt64, freelancer: Address, amount: UFix64)
    access(all) event EscrowReleased(id: UInt64, freelancer: Address, amount: UFix64)
    access(all) event EscrowCancelled(id: UInt64)
    access(all) event EscrowRefunded(id: UInt64, client: Address, amount: UFix64)
    access(all) event MilestoneCompleted(id: UInt64, milestoneId: UInt64)
    access(all) event MilestoneConfirmed(id: UInt64, milestoneId: UInt64, freelancer: Address, amount: UFix64)

    // ── State ──
    access(self) var escrows: {UInt64: EscrowRecord}
    access(self) var vaults: @{UInt64: FlowToken.Vault}
    access(self) var nextEscrowID: UInt64

    // ── Public Functions ──

    access(all) fun createEscrow(
        client: Address,
        freelancer: Address,
        title: String,
        description: String,
        amount: UFix64,
        deadline: UFix64?,
        milestoneTitles: [String],
        milestoneAmounts: [UFix64]
    ): UInt64 {
        // Input validation
        assert(client != freelancer, message: "Client and freelancer must be different addresses")
        assert(title.length > 0 && title.length <= 200, message: "Title must be 1-200 characters")
        assert(description.length <= 2000, message: "Description must be under 2000 characters")
        assert(milestoneTitles.length <= 20, message: "Maximum 20 milestones allowed")

        let hasMilestones = milestoneTitles.length > 0

        if hasMilestones {
            assert(
                milestoneTitles.length == milestoneAmounts.length,
                message: "Milestone titles and amounts must have the same length"
            )
        }

        var finalAmount = amount
        var milestones: [Milestone] = []

        if hasMilestones {
            var sum: UFix64 = 0.0
            var i = 0
            while i < milestoneTitles.length {
                assert(milestoneTitles[i].length > 0 && milestoneTitles[i].length <= 200, message: "Milestone title must be 1-200 characters")
                assert(milestoneAmounts[i] > 0.0, message: "Milestone amount must be greater than zero")
                let milestone = Milestone(
                    id: UInt64(i),
                    title: milestoneTitles[i],
                    amount: milestoneAmounts[i]
                )
                milestones.append(milestone)
                sum = sum + milestoneAmounts[i]
                i = i + 1
            }
            finalAmount = sum
        }

        assert(finalAmount > 0.0, message: "Amount must be greater than zero")

        let id = self.nextEscrowID
        self.nextEscrowID = self.nextEscrowID + 1

        let record = EscrowRecord(
            id: id,
            client: client,
            freelancer: freelancer,
            amount: finalAmount,
            title: title,
            description: description,
            deadline: deadline,
            milestones: milestones
        )

        self.escrows[id] = record
        emit EscrowCreated(id: id, client: client, freelancer: freelancer, amount: finalAmount, title: title)
        return id
    }

    access(all) fun updateEscrow(
        id: UInt64,
        client: Address,
        title: String,
        description: String,
        amount: UFix64,
        deadline: UFix64?,
        milestoneTitles: [String],
        milestoneAmounts: [UFix64]
    ) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.client == client, message: "Only client can update escrow")
        assert(record.status == Status.Created, message: "Escrow can only be updated before funding")

        // Input validation
        assert(title.length > 0 && title.length <= 200, message: "Title must be 1-200 characters")
        assert(description.length <= 2000, message: "Description must be under 2000 characters")
        assert(milestoneTitles.length <= 20, message: "Maximum 20 milestones allowed")

        record.setTitle(title)
        record.setDescription(description)
        record.setDeadline(deadline)

        // Update milestones if provided
        let hasMilestones = milestoneTitles.length > 0
        if hasMilestones {
            assert(
                milestoneTitles.length == milestoneAmounts.length,
                message: "Milestone titles and amounts must have the same length"
            )
            var newMilestones: [Milestone] = []
            var sum: UFix64 = 0.0
            var i = 0
            while i < milestoneTitles.length {
                assert(milestoneTitles[i].length > 0 && milestoneTitles[i].length <= 200, message: "Milestone title must be 1-200 characters")
                assert(milestoneAmounts[i] > 0.0, message: "Milestone amount must be greater than zero")
                newMilestones.append(Milestone(
                    id: UInt64(i),
                    title: milestoneTitles[i],
                    amount: milestoneAmounts[i]
                ))
                sum = sum + milestoneAmounts[i]
                i = i + 1
            }
            record.setMilestones(newMilestones)
            record.setAmount(sum)
        } else {
            // No milestones — use the amount parameter directly
            assert(amount > 0.0, message: "Amount must be greater than zero")
            record.setAmount(amount)
            if record.milestones.length > 0 {
                record.setMilestones([])
            }
        }

        self.escrows[id] = record
    }

    access(all) fun fundEscrow(id: UInt64, vault: @FlowToken.Vault) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.Created, message: "Escrow must be in Created status to fund")
        assert(vault.balance == record.amount, message: "Vault balance must match escrow amount")

        record.setStatus(Status.Funded)
        self.escrows[id] = record

        let oldVault <- self.vaults[id] <- vault
        destroy oldVault

        emit EscrowFunded(id: id)
    }

    access(all) fun acceptEscrow(id: UInt64, freelancer: Address) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.Funded, message: "Escrow must be Funded to accept")
        assert(record.freelancer == freelancer, message: "Only assigned freelancer can accept")

        record.setStatus(Status.Pending)
        self.escrows[id] = record

        emit EscrowAccepted(id: id, freelancer: freelancer)
    }

    access(all) fun startWork(id: UInt64, freelancer: Address) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.Pending, message: "Escrow must be Pending to start work")
        assert(record.freelancer == freelancer, message: "Only assigned freelancer can start work")

        record.setStatus(Status.InProgress)
        self.escrows[id] = record

        emit WorkStarted(id: id)
    }

    access(all) fun completeEscrow(id: UInt64, freelancer: Address, deliverableURI: String) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.InProgress, message: "Escrow must be InProgress to complete")
        assert(record.freelancer == freelancer, message: "Only assigned freelancer can complete")
        assert(record.milestones.length == 0, message: "Use completeMilestone for milestone-based escrows")
        assert(deliverableURI.length <= 500, message: "Deliverable URI must be under 500 characters")

        record.setDeliverableURI(deliverableURI)
        record.setStatus(Status.Completed)
        self.escrows[id] = record

        emit EscrowCompleted(id: id)
    }

    access(all) fun confirmCompletion(id: UInt64, client: Address) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.Completed, message: "Escrow must be Completed to confirm")
        assert(record.client == client, message: "Only client can confirm completion")
        assert(record.milestones.length == 0, message: "Use confirmMilestone for milestone-based escrows")

        // Withdraw from escrow vault and send to freelancer
        let vault <- self.vaults.remove(key: id) ?? panic("Escrow vault not found")
        let freelancerAccount = getAccount(record.freelancer)
        let receiverRef = freelancerAccount.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow freelancer receiver")

        let amount = vault.balance
        receiverRef.deposit(from: <- vault)

        record.setStatus(Status.Released)
        self.escrows[id] = record

        emit CompletionConfirmed(id: id, freelancer: record.freelancer, amount: amount)
        emit EscrowReleased(id: id, freelancer: record.freelancer, amount: amount)
    }

    access(all) fun completeMilestone(id: UInt64, milestoneId: UInt64, freelancer: Address) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.InProgress, message: "Escrow must be InProgress to complete a milestone")
        assert(record.freelancer == freelancer, message: "Only assigned freelancer can complete milestones")
        assert(record.milestones.length > 0, message: "Escrow has no milestones")

        // Find the milestone and verify it is Pending
        var found = false
        var i = 0
        while i < record.milestones.length {
            if record.milestones[i].id == milestoneId {
                assert(
                    record.milestones[i].status == MilestoneStatus.Pending,
                    message: "Milestone must be Pending to complete"
                )
                found = true
                break
            }
            i = i + 1
        }
        assert(found, message: "Milestone not found")

        record.setMilestoneStatus(milestoneId: milestoneId, status: MilestoneStatus.Completed)
        self.escrows[id] = record

        emit MilestoneCompleted(id: id, milestoneId: milestoneId)
    }

    access(all) fun confirmMilestone(id: UInt64, milestoneId: UInt64, client: Address) {
        let record = self.escrows[id] ?? panic("Escrow not found")
        assert(record.status == Status.InProgress, message: "Escrow must be InProgress to confirm a milestone")
        assert(record.client == client, message: "Only client can confirm milestones")
        assert(record.milestones.length > 0, message: "Escrow has no milestones")

        // Find the milestone and verify it is Completed
        var milestoneAmount: UFix64 = 0.0
        var found = false
        var i = 0
        while i < record.milestones.length {
            if record.milestones[i].id == milestoneId {
                assert(
                    record.milestones[i].status == MilestoneStatus.Completed,
                    message: "Milestone must be Completed to confirm"
                )
                milestoneAmount = record.milestones[i].amount
                found = true
                break
            }
            i = i + 1
        }
        assert(found, message: "Milestone not found")

        // Withdraw milestone amount from escrow vault
        let vaultRef = (&self.vaults[id] as auth(FungibleToken.Withdraw) &FlowToken.Vault?)
            ?? panic("Escrow vault not found")
        let payment <- vaultRef.withdraw(amount: milestoneAmount)

        let freelancerAccount = getAccount(record.freelancer)
        let receiverRef = freelancerAccount.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow freelancer receiver")

        // Update milestone status BEFORE deposit (checks-effects-interactions)
        record.setMilestoneStatus(milestoneId: milestoneId, status: MilestoneStatus.Released)

        // Check if all milestones are released
        var allReleased = true
        var j = 0
        while j < record.milestones.length {
            if record.milestones[j].status != MilestoneStatus.Released {
                allReleased = false
                break
            }
            j = j + 1
        }

        if allReleased {
            record.setStatus(Status.Released)
            // Remove empty vault
            let emptyVault <- self.vaults.remove(key: id)
            destroy emptyVault
        }

        self.escrows[id] = record

        // Deposit payment to freelancer AFTER state updates
        receiverRef.deposit(from: <- payment)

        emit MilestoneConfirmed(id: id, milestoneId: milestoneId, freelancer: record.freelancer, amount: milestoneAmount)

        if allReleased {
            emit EscrowReleased(id: id, freelancer: record.freelancer, amount: record.amount)
        }
    }

    access(all) fun cancelEscrow(id: UInt64, caller: Address) {
        let record = self.escrows[id] ?? panic("Escrow not found")

        // Cancellation rules based on status
        switch record.status {
            case Status.Created:
                // Only client can cancel when Created (not funded yet)
                assert(record.client == caller, message: "Only client can cancel a Created escrow")

            case Status.Funded:
                // Only client can cancel when Funded
                assert(record.client == caller, message: "Only client can cancel a Funded escrow")

            case Status.Pending:
                // Either party can cancel when Pending
                assert(
                    record.client == caller || record.freelancer == caller,
                    message: "Only client or freelancer can cancel a Pending escrow"
                )

            case Status.InProgress:
                // Only freelancer can cancel when InProgress
                assert(record.freelancer == caller, message: "Only freelancer can cancel an InProgress escrow")

            case Status.Completed:
                panic("Cannot cancel a Completed escrow")

            case Status.Released:
                panic("Cannot cancel a Released escrow")

            case Status.Cancelled:
                panic("Escrow is already cancelled")
        }

        // Refund remaining vault balance to client if vault exists
        if let vault <- self.vaults.remove(key: id) {
            if vault.balance > 0.0 {
                let clientAccount = getAccount(record.client)
                let receiverRef = clientAccount.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    ?? panic("Could not borrow client receiver")
                let refundAmount = vault.balance
                receiverRef.deposit(from: <- vault)
                emit EscrowRefunded(id: id, client: record.client, amount: refundAmount)
            } else {
                destroy vault
            }
        }

        record.setStatus(Status.Cancelled)
        self.escrows[id] = record

        emit EscrowCancelled(id: id)
    }

    // ── Read Functions ──

    access(all) fun getEscrow(id: UInt64): EscrowData? {
        if let record = self.escrows[id] {
            return record.toData()
        }
        return nil
    }

    access(all) fun getAllEscrows(): [EscrowData] {
        let result: [EscrowData] = []
        for id in self.escrows.keys {
            result.append(self.escrows[id]!.toData())
        }
        return result
    }

    // ── Init ──
    init() {
        self.escrows = {}
        self.vaults <- {}
        self.nextEscrowID = 1
    }
}
