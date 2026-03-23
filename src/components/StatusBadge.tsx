import { EscrowStatus, STATUS_LABELS, STATUS_COLORS } from "../lib/types";

export default function StatusBadge({ status }: { status: EscrowStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
