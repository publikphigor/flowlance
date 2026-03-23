export enum EscrowStatus {
  Created = 0,
  Funded = 1,
  Pending = 2,      // freelancer accepted
  InProgress = 3,   // freelancer started work
  Completed = 4,    // freelancer marked complete (no milestones)
  Released = 5,     // funds sent to freelancer
  Cancelled = 6,    // cancelled, refunded
}

export const STATUS_LABELS: Record<EscrowStatus, string> = {
  [EscrowStatus.Created]: "Created",
  [EscrowStatus.Funded]: "Funded",
  [EscrowStatus.Pending]: "Pending",
  [EscrowStatus.InProgress]: "In Progress",
  [EscrowStatus.Completed]: "Completed",
  [EscrowStatus.Released]: "Released",
  [EscrowStatus.Cancelled]: "Cancelled",
};

export const STATUS_COLORS: Record<EscrowStatus, string> = {
  [EscrowStatus.Created]: "bg-gray-100 text-gray-700",
  [EscrowStatus.Funded]: "bg-green-100 text-green-700",
  [EscrowStatus.Pending]: "bg-yellow-100 text-yellow-700",
  [EscrowStatus.InProgress]: "bg-blue-100 text-blue-700",
  [EscrowStatus.Completed]: "bg-emerald-100 text-emerald-700",
  [EscrowStatus.Released]: "bg-green-500 text-white",
  [EscrowStatus.Cancelled]: "bg-red-100 text-red-700",
};

export enum MilestoneStatus {
  Pending = 0,
  Completed = 1,
  Released = 2,
}

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  [MilestoneStatus.Pending]: "Pending",
  [MilestoneStatus.Completed]: "Awaiting Confirmation",
  [MilestoneStatus.Released]: "Paid",
};

export interface Milestone {
  id: number;
  title: string;
  amount: string;
  status: MilestoneStatus;
}

export interface Escrow {
  id: number;
  client: string;
  freelancer: string;
  amount: string;
  status: EscrowStatus;
  title: string;
  description: string;
  deliverableURI: string | null;
  createdAt: string;
  deadline: string | null;
  milestones: Milestone[];
}
