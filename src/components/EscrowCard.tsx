import { Link } from "react-router-dom";
import type { Escrow } from "../lib/types";
import { EscrowStatus, MilestoneStatus, STATUS_LABELS } from "../lib/types";
import { formatAmount } from "../lib/format";

export default function EscrowCard({
  escrow,
  role,
}: {
  escrow: Escrow;
  role: "client" | "freelancer";
}) {
  const counterparty =
    role === "client" ? escrow.freelancer : escrow.client;
  const counterpartyLabel = role === "client" ? "Freelancer" : "Client";

  const hasMilestones = escrow.milestones && escrow.milestones.length > 0;

  const clientNeedsAction =
    role === "client" &&
    (escrow.status === EscrowStatus.Created ||
      escrow.status === EscrowStatus.Completed ||
      (escrow.status === EscrowStatus.InProgress &&
        hasMilestones &&
        escrow.milestones.some((m) => m.status === MilestoneStatus.Completed)));

  const freelancerNeedsAction =
    role === "freelancer" &&
    (escrow.status === EscrowStatus.Funded ||
      escrow.status === EscrowStatus.Pending ||
      escrow.status === EscrowStatus.InProgress);

  const needsAction = clientNeedsAction || freelancerNeedsAction;

  const milestonesReleased = hasMilestones
    ? escrow.milestones.filter((m) => m.status === MilestoneStatus.Released).length
    : 0;

  const isTerminal =
    escrow.status === EscrowStatus.Released || escrow.status === EscrowStatus.Cancelled;

  const statusDot =
    escrow.status === EscrowStatus.Released
      ? "bg-green-500"
      : escrow.status === EscrowStatus.Cancelled
        ? "bg-red-400"
        : escrow.status === EscrowStatus.InProgress
          ? "bg-blue-500"
          : escrow.status === EscrowStatus.Completed
            ? "bg-emerald-500"
            : "bg-gray-300";

  return (
    <Link
      to={`/escrow/${escrow.id}`}
      className={`group relative block rounded-2xl border bg-white p-5 transition-all hover:shadow-md ${
        isTerminal
          ? "border-gray-100 opacity-75 hover:opacity-100"
          : needsAction
            ? "border-green-200 shadow-sm hover:border-green-300"
            : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Action indicator */}
      {needsAction && (
        <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
      )}

      {/* Title + status */}
      <div className="flex items-start gap-3 mb-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition text-sm">
            {escrow.title}
          </h3>
          <span className="text-[11px] font-medium text-gray-400">
            {STATUS_LABELS[escrow.status]}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-3">
        <span className="font-mono text-xl font-bold text-gray-900">
          {formatAmount(escrow.amount)}
        </span>
        <span className="ml-1 text-xs text-gray-400">FLOW</span>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-300">{counterpartyLabel}:</span>
          <span className="font-mono">
            {counterparty?.slice(0, 6)}...{counterparty?.slice(-4)}
          </span>
        </div>

        {hasMilestones && (
          <div className="flex items-center gap-1.5">
            {/* Mini progress dots */}
            <div className="flex gap-0.5">
              {escrow.milestones.map((m) => (
                <span
                  key={m.id}
                  className={`h-1.5 w-1.5 rounded-full ${
                    m.status === MilestoneStatus.Released
                      ? "bg-green-500"
                      : m.status === MilestoneStatus.Completed
                        ? "bg-yellow-400"
                        : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px]">
              {milestonesReleased}/{escrow.milestones.length}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
