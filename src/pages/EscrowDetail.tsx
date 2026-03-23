import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fcl } from "../lib/flow";
import * as t from "@onflow/types";
import {
  FUND_ESCROW,
  ACCEPT_ESCROW,
  START_WORK,
  COMPLETE_ESCROW,
  CONFIRM_COMPLETION,
  COMPLETE_MILESTONE,
  CONFIRM_MILESTONE,
  CANCEL_ESCROW,
  UPDATE_ESCROW,
} from "../lib/cadence";
import { useAuth } from "../hooks/useAuth";
import { useEscrows } from "../hooks/useEscrows";
import {
  EscrowStatus,
  MilestoneStatus,
  STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
} from "../lib/types";
import StatusBadge from "../components/StatusBadge";
import { formatAmount, addrMatch, parseAmountInput, formatInputDisplay } from "../lib/format";
import type { Escrow, Milestone } from "../lib/types";
import type { CadenceArg, FclAuthz, ArgsFn } from "../lib/fcl-types";

interface EditMilestone {
  title: string;
  amount: string;
}

export default function EscrowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchOne } = useEscrows();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMilestones, setEditMilestones] = useState<EditMilestone[]>([]);
  const [deliveryURI, setDeliveryURI] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await fetchOne(Number(id));
    setEscrow(data);
    setLoading(false);
  }, [id, fetchOne]);

  useEffect(() => {
    load();
  }, [load]);

  const tx = async (cadence: string, argsFn: ArgsFn) => {
    setError("");
    setTxPending(true);
    try {
      const txId = await fcl.mutate({
        cadence,
        args: argsFn,
        payer: fcl.authz as FclAuthz,
        proposer: fcl.authz as FclAuthz,
        authorizations: [fcl.authz as FclAuthz],
        limit: 999,
      });
      await fcl.tx(txId).onceSealed();
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      if (msg.includes("Cannot withdraw tokens") || msg.includes("greater than the balance")) {
        setError("Insufficient FLOW balance in your wallet to fund this escrow.");
      } else {
        setError(msg);
      }
    } finally {
      setTxPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }
  if (!escrow) return <p className="py-20 text-center text-gray-400">Escrow not found.</p>;

  const addr = user.addr;
  const isClient = addrMatch(addr, escrow.client);
  const isFreelancer = addrMatch(addr, escrow.freelancer);

  if (!loading && !isClient && !isFreelancer) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-900 font-semibold">Access denied</p>
        <p className="mt-1 text-sm text-gray-400">Only the client and freelancer can view this escrow.</p>
      </div>
    );
  }

  const s = escrow.status;
  const hasMilestones = escrow.milestones && escrow.milestones.length > 0;
  const isTerminal = s === EscrowStatus.Cancelled || s === EscrowStatus.Released;
  const startEdit = () => {
    setEditTitle(escrow.title);
    setEditDesc(escrow.description);
    setEditAmount(escrow.amount);
    setEditDeadline(
      escrow.deadline
        ? new Date(parseFloat(escrow.deadline) * 1000).toISOString().split("T")[0]
        : ""
    );
    setEditMilestones(
      hasMilestones
        ? escrow.milestones.map((m) => ({ title: m.title, amount: m.amount }))
        : []
    );
    setEditing(true);
  };

  const updateEditMilestone = (i: number, field: keyof EditMilestone, val: string) => {
    const updated = [...editMilestones];
    updated[i] = { ...updated[i], [field]: field === "amount" ? parseAmountInput(val) : val };
    setEditMilestones(updated);
  };

  const addEditMilestone = () =>
    setEditMilestones([...editMilestones, { title: "", amount: "" }]);

  const removeEditMilestone = (i: number) => {
    if (editMilestones.length <= 1) return;
    setEditMilestones(editMilestones.filter((_, idx) => idx !== i));
  };

  const editMilestoneTotal = editMilestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0), 0
  );

  const saveEdit = async () => {
    let dl = null;
    if (editDeadline) dl = (new Date(editDeadline).getTime() / 1000).toFixed(8);

    const mTitles = editMilestones.map((m) => m.title);
    const mAmounts = editMilestones.map((m) => parseFloat(m.amount || "0").toFixed(8));

    // For non-milestone: use editAmount; for milestone: use milestone total (contract recalculates)
    const finalAmount = editMilestones.length > 0
      ? editMilestoneTotal.toFixed(8)
      : parseFloat(editAmount || "0").toFixed(8);

    await tx(UPDATE_ESCROW, (arg: CadenceArg) => [
      arg(String(escrow.id), t.UInt64),
      arg(editTitle, t.String),
      arg(editDesc, t.String),
      arg(finalAmount, t.UFix64),
      arg(dl, t.Optional(t.UFix64)),
      arg(mTitles, t.Array(t.String)),
      arg(mAmounts, t.Array(t.UFix64)),
    ]);
    setEditing(false);
  };

  const deadlineStr = escrow.deadline
    ? new Date(parseFloat(escrow.deadline) * 1000).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  const steps = hasMilestones
    ? ["Created", "Funded", "Pending", "In Progress", "Released"]
    : ["Created", "Funded", "Pending", "In Progress", "Completed", "Released"];

  const stepIndex = hasMilestones
    ? [0, 1, 2, 3, 5].indexOf(s)
    : s <= 5 ? s : -1;

  const milestonesReleased = hasMilestones
    ? escrow.milestones.filter((m) => m.status === MilestoneStatus.Released).length
    : 0;
  const amountReleased = hasMilestones
    ? escrow.milestones
        .filter((m) => m.status === MilestoneStatus.Released)
        .reduce((sum, m) => sum + parseFloat(m.amount), 0)
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs font-medium text-gray-400 hover:text-green-600 mb-3 transition"
        >
          &larr; Back to escrows
        </button>
        <div className="flex items-start justify-between gap-4">
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold text-gray-900 border-b-2 border-green-300 outline-none focus:border-green-500 flex-1 bg-transparent"
            />
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{escrow.title}</h1>
          )}
          <StatusBadge status={s} />
        </div>
      </div>

      {/* Progress */}
      {!isTerminal && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= stepIndex ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {steps.map((label, i) => (
              <span key={i} className={`text-[10px] font-medium ${i <= stepIndex ? "text-green-600" : "text-gray-300"}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        {/* Amount */}
        <div className="flex items-baseline justify-between border-b border-gray-50 pb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Payment</span>
          <div className="text-right">
            {editing && editMilestones.length === 0 ? (
              <div className="flex items-baseline gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatInputDisplay(editAmount)}
                  onChange={(e) => setEditAmount(parseAmountInput(e.target.value))}
                  className="w-36 text-right font-mono text-2xl font-bold text-gray-900 border-b-2 border-green-300 outline-none focus:border-green-500 bg-transparent"
                />
                <span className="text-sm text-gray-400">FLOW</span>
              </div>
            ) : (
              <>
                <span className="font-mono text-2xl font-bold text-gray-900">
                  {editing && editMilestones.length > 0
                    ? formatAmount(editMilestoneTotal)
                    : formatAmount(escrow.amount)}
                </span>
                <span className="ml-1.5 text-sm text-gray-400">FLOW</span>
              </>
            )}
            {hasMilestones && s >= EscrowStatus.InProgress && !editing && (
              <p className="mt-0.5 font-mono text-xs text-green-600">{formatAmount(amountReleased)} released</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Description</span>
          {editing ? (
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 resize-none"
            />
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
              {escrow.description || "No description."}
            </p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-xl bg-gray-50/80 p-4">
          <Info label="Client"><Addr value={escrow.client} you={isClient} /></Info>
          <Info label="Freelancer"><Addr value={escrow.freelancer} you={isFreelancer} /></Info>
          <Info label="Deadline">
            {editing ? (
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-500 w-full"
              />
            ) : (
              deadlineStr ?? "None"
            )}
          </Info>
          <Info label="Status">{STATUS_LABELS[s]}</Info>
        </div>

        {/* Deliverable */}
        {escrow.deliverableURI && (
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Deliverable</span>
            {/^https?:\/\//i.test(escrow.deliverableURI) ? (
              <a
                href={escrow.deliverableURI}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100 transition break-all font-mono"
              >
                {escrow.deliverableURI}
              </a>
            ) : (
              <span className="mt-1 block rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 break-all font-mono">
                {escrow.deliverableURI} <span className="text-red-500 font-semibold">(invalid link)</span>
              </span>
            )}
          </div>
        )}

        {/* Milestones */}
        {(hasMilestones || (editing && editMilestones.length > 0)) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Milestones</span>
              {!editing && (
                <span className="font-mono text-xs text-gray-400">{milestonesReleased}/{escrow.milestones.length} completed</span>
              )}
            </div>

            {editing ? (
              /* Editable milestones */
              <div className="space-y-2">
                {editMilestones.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="font-mono text-[10px] font-bold text-gray-300 w-5 text-center shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <input
                      type="text"
                      placeholder="Milestone title"
                      value={m.title}
                      onChange={(e) => updateEditMilestone(i, "title", e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formatInputDisplay(m.amount)}
                      onChange={(e) => updateEditMilestone(i, "amount", e.target.value)}
                      className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono text-right outline-none focus:border-green-500"
                    />
                    {editMilestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEditMilestone(i)}
                        className="text-gray-300 hover:text-red-500 text-lg leading-none transition"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditMilestone}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Add milestone
                </button>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="font-mono text-sm font-bold text-gray-900">{formatAmount(editMilestoneTotal)}</span>
                  <span className="text-xs text-gray-400">FLOW</span>
                </div>
              </div>
            ) : (
              /* Read-only milestones */
              <div className="space-y-2">
                {escrow.milestones.map((m) => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    escrowId={escrow.id}
                    escrowStatus={s}
                    isClient={isClient}
                    isFreelancer={isFreelancer}
                    txPending={txPending}
                    onTx={tx}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</p>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          {/* Edit mode: Save / Discard */}
          {editing && (
            <div className="flex items-center justify-end gap-2">
              <SecondaryBtn onClick={() => setEditing(false)} mobileHalf>Discard</SecondaryBtn>
              <Btn pending={txPending} onClick={saveEdit} mobileHalf>Save</Btn>
            </div>
          )}

          {/* Client: Created — Cancel left, Edit + Fund right. Mobile: Cancel+Edit half, Fund full below */}
          {!editing && isClient && s === EscrowStatus.Created && (
            <>
              <div className="flex items-center justify-between">
                <CancelBtn pending={txPending} onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                  Cancel
                </CancelBtn>
                <div className="hidden sm:flex gap-2">
                  <SecondaryBtn onClick={startEdit}>Edit</SecondaryBtn>
                  <Btn pending={txPending} onClick={() => tx(FUND_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                    Fund — {formatAmount(escrow.amount)} FLOW
                  </Btn>
                </div>
              </div>
              {/* Mobile stacked layout */}
              <div className="sm:hidden space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <CancelBtn pending={txPending} full onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                    Cancel
                  </CancelBtn>
                  <SecondaryBtn full onClick={startEdit}>Edit</SecondaryBtn>
                </div>
                <Btn pending={txPending} full onClick={() => tx(FUND_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                  Fund — {formatAmount(escrow.amount)} FLOW
                </Btn>
              </div>
            </>
          )}

          {/* Client: Funded — Cancel left, Edit right */}
          {!editing && isClient && s === EscrowStatus.Funded && (
            <div className="flex items-center justify-between">
              <CancelBtn pending={txPending} onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Cancel & Refund
              </CancelBtn>
              <SecondaryBtn onClick={startEdit}>Edit</SecondaryBtn>
            </div>
          )}

          {/* Client: Pending — Cancel left */}
          {!editing && isClient && s === EscrowStatus.Pending && (
            <div className="flex justify-end">
              <CancelBtn pending={txPending} mobileHalf onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Cancel & Refund
              </CancelBtn>
            </div>
          )}

          {/* Freelancer: Funded — Accept right-aligned */}
          {isFreelancer && s === EscrowStatus.Funded && (
            <div className="flex justify-end">
              <Btn pending={txPending} mobileHalf onClick={() => tx(ACCEPT_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Accept Job
              </Btn>
            </div>
          )}

          {/* Freelancer: Pending — Cancel left, Start Work right */}
          {isFreelancer && s === EscrowStatus.Pending && (
            <div className="flex items-center justify-between gap-2">
              <CancelBtn pending={txPending} mobileHalf onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Cancel
              </CancelBtn>
              <Btn pending={txPending} mobileHalf onClick={() => tx(START_WORK, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Start Work
              </Btn>
            </div>
          )}

          {/* Freelancer: InProgress, no milestones — deliverable + actions */}
          {isFreelancer && s === EscrowStatus.InProgress && !hasMilestones && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Deliverable URL (Google Drive, GitHub, etc.)"
                value={deliveryURI}
                onChange={(e) => setDeliveryURI(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
              <div className="flex items-center justify-between gap-2">
                <CancelBtn pending={txPending} mobileHalf onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                  Cancel & Refund
                </CancelBtn>
                <Btn pending={txPending} mobileHalf onClick={() =>
                  tx(COMPLETE_ESCROW, (arg: CadenceArg) => [
                    arg(String(escrow.id), t.UInt64),
                    arg(deliveryURI, t.String),
                  ])
                }>
                  Mark as Complete
                </Btn>
              </div>
            </div>
          )}

          {/* Freelancer: InProgress, with milestones — just cancel */}
          {isFreelancer && s === EscrowStatus.InProgress && hasMilestones && (
            <div className="flex justify-end">
              <CancelBtn pending={txPending} mobileHalf onClick={() => tx(CANCEL_ESCROW, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Cancel & Refund
              </CancelBtn>
            </div>
          )}

          {/* Client: Completed — Confirm & Release right-aligned */}
          {isClient && s === EscrowStatus.Completed && !hasMilestones && (
            <div className="flex justify-end">
              <Btn pending={txPending} mobileHalf onClick={() => tx(CONFIRM_COMPLETION, (arg: CadenceArg) => [arg(String(escrow.id), t.UInt64)])}>
                Confirm & Release {formatAmount(escrow.amount)} FLOW
              </Btn>
            </div>
          )}

          {/* Terminal states */}
          {s === EscrowStatus.Released && (
            <div className="rounded-xl bg-green-50 border border-green-100 py-4 text-center">
              <p className="font-mono text-lg font-bold text-green-700">{formatAmount(escrow.amount)} FLOW</p>
              <p className="text-xs text-green-600 mt-0.5">Released to freelancer</p>
            </div>
          )}
          {s === EscrowStatus.Cancelled && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 py-4 text-center">
              <p className="text-sm text-gray-400">Escrow cancelled. Funds refunded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestoneRow({
  milestone, escrowId, escrowStatus, isClient, isFreelancer, txPending, onTx,
}: {
  milestone: Milestone; escrowId: number; escrowStatus: EscrowStatus;
  isClient: boolean; isFreelancer: boolean; txPending: boolean;
  onTx: (cadence: string, args: ArgsFn) => Promise<void>;
}) {
  const ms = milestone.status;
  const actionBtnClass = "rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition";

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
        ms === MilestoneStatus.Released
          ? "border-green-200 bg-green-50/50"
          : ms === MilestoneStatus.Completed
            ? "border-yellow-200 bg-yellow-50/50"
            : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${
            ms === MilestoneStatus.Released
              ? "bg-green-500 text-white"
              : ms === MilestoneStatus.Completed
                ? "bg-yellow-400 text-white"
                : "bg-gray-200 text-gray-500"
          }`}
        >
          {ms === MilestoneStatus.Released ? "\u2713" : milestone.id + 1}
        </span>
        <span className="text-sm text-gray-800 truncate">{milestone.title}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider hidden sm:block ${
            ms === MilestoneStatus.Released ? "text-green-600"
              : ms === MilestoneStatus.Completed ? "text-yellow-600"
                : "text-gray-300"
          }`}
        >
          {MILESTONE_STATUS_LABELS[ms]}
        </span>
        <span className="font-mono text-sm font-semibold text-gray-700 tabular-nums">
          {formatAmount(milestone.amount)}
        </span>

        {isFreelancer &&
          ms === MilestoneStatus.Pending &&
          escrowStatus === EscrowStatus.InProgress && (
            <button
              disabled={txPending}
              onClick={() =>
                onTx(COMPLETE_MILESTONE, (arg: CadenceArg) => [
                  arg(String(escrowId), t.UInt64),
                  arg(String(milestone.id), t.UInt64),
                ])
              }
              className={actionBtnClass}
            >
              Mark as Complete
            </button>
          )}

        {isClient &&
          ms === MilestoneStatus.Completed &&
          escrowStatus === EscrowStatus.InProgress && (
            <button
              disabled={txPending}
              onClick={() =>
                onTx(CONFIRM_MILESTONE, (arg: CadenceArg) => [
                  arg(String(escrowId), t.UInt64),
                  arg(String(milestone.id), t.UInt64),
                ])
              }
              className={actionBtnClass}
            >
              Confirm & Pay
            </button>
          )}
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</span>
      <div className="mt-0.5 text-sm text-gray-800">{children}</div>
    </div>
  );
}

function Addr({ value, you }: { value: string; you: boolean }) {
  if (!value) return <span className="text-gray-300">—</span>;
  return (
    <span className={`font-mono text-xs ${you ? "text-green-600 font-bold" : "text-gray-600"}`}>
      {value.slice(0, 6)}...{value.slice(-4)}
      {you && <span className="ml-1 text-[9px] font-medium text-green-400 uppercase">you</span>}
    </span>
  );
}

function Btn({ onClick, pending, full, mobileHalf, children }: { onClick: () => void; pending: boolean; full?: boolean; mobileHalf?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition shadow-sm ${full ? "w-full" : ""} ${mobileHalf ? "w-1/2 sm:w-auto" : ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Processing...
        </span>
      ) : children}
    </button>
  );
}

function SecondaryBtn({ onClick, full, mobileHalf, children }: { onClick: () => void; full?: boolean; mobileHalf?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition ${full ? "w-full" : ""} ${mobileHalf ? "w-1/2 sm:w-auto" : ""}`}
    >
      {children}
    </button>
  );
}

function CancelBtn({ onClick, pending, full, mobileHalf, children }: { onClick: () => void; pending: boolean; full?: boolean; mobileHalf?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`rounded-xl border border-red-100 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition ${full ? "w-full" : ""} ${mobileHalf ? "w-1/2 sm:w-auto" : ""}`}
    >
      {children}
    </button>
  );
}
