import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fcl } from "../lib/flow";
import * as t from "@onflow/types";
import { CREATE_ESCROW } from "../lib/cadence";
import { useAuth } from "../hooks/useAuth";
import { parseAmountInput, formatInputDisplay, formatAmount } from "../lib/format";
import type { CadenceArg, FclAuthz } from "../lib/fcl-types";

interface MilestoneInput {
  title: string;
  amount: string;
}

export default function CreateEscrow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [useMilestones, setUseMilestones] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", amount: "" },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!user.loggedIn) {
    return (
      <div className="py-20 text-center text-gray-500">
        Connect your wallet to create an escrow.
      </div>
    );
  }

  const milestoneTotal = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  const addMilestone = () =>
    setMilestones([...milestones, { title: "", amount: "" }]);

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof MilestoneInput, val: string) => {
    const updated = [...milestones];
    updated[i] = {
      ...updated[i],
      [field]: field === "amount" ? parseAmountInput(val) : val,
    };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Prevent self-assignment
    if (freelancer.toLowerCase().replace(/^0x/, "") === (user.addr ?? "").toLowerCase().replace(/^0x/, "")) {
      setError("You cannot assign yourself as the freelancer.");
      return;
    }

    const finalAmount = useMilestones ? milestoneTotal : parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) {
      setError("Total amount must be greater than zero.");
      return;
    }

    if (useMilestones) {
      for (const m of milestones) {
        if (!m.title.trim() || !m.amount || parseFloat(m.amount) <= 0) {
          setError("All milestones must have a title and amount.");
          return;
        }
      }
    }

    setSending(true);
    try {
      const formattedAmount = finalAmount.toFixed(8);
      let deadlineArg = null;
      if (deadline) deadlineArg = (new Date(deadline).getTime() / 1000).toFixed(8);

      const mTitles = useMilestones ? milestones.map((m) => m.title) : [];
      const mAmounts = useMilestones
        ? milestones.map((m) => parseFloat(m.amount).toFixed(8))
        : [];

      const txId = await fcl.mutate({
        cadence: CREATE_ESCROW,
        args: (arg: CadenceArg) => [
          arg(freelancer, t.Address),
          arg(title, t.String),
          arg(description, t.String),
          arg(formattedAmount, t.UFix64),
          arg(deadlineArg, t.Optional(t.UFix64)),
          arg(mTitles, t.Array(t.String)),
          arg(mAmounts, t.Array(t.UFix64)),
        ],
        payer: fcl.authz as FclAuthz,
        proposer: fcl.authz as FclAuthz,
        authorizations: [fcl.authz as FclAuthz],
        limit: 999,
      });

      await fcl.tx(txId).onceSealed();
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSending(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Create Escrow</h1>
      <p className="mt-1 text-sm text-gray-500">
        Define the job and assign a freelancer. You can edit details before funding.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Job Title">
          <input
            type="text"
            required
            placeholder="e.g. Design a logo for my startup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="inp"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={3}
            placeholder="Deliverables, requirements, references..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="inp resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Freelancer Address">
            <input
              type="text"
              required
              placeholder="0x..."
              value={freelancer}
              onChange={(e) => setFreelancer(e.target.value)}
              className="inp font-mono text-xs"
            />
          </Field>
          <Field label="Deadline (optional)">
            <input
              type="date"
              min={minDate}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="inp"
            />
          </Field>
        </div>

        {/* Milestones toggle */}
        <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50/60 px-4 py-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Use milestones</span>
            <p className="text-xs text-gray-400">Split payment into stages</p>
          </div>
          <button
            type="button"
            onClick={() => setUseMilestones(!useMilestones)}
            className={`relative h-6 w-11 rounded-full transition ${
              useMilestones ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                useMilestones ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {useMilestones ? (
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex items-center justify-center w-6 h-10 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-gray-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder={`Milestone ${i + 1} title`}
                    value={m.title}
                    onChange={(e) => updateMilestone(i, "title", e.target.value)}
                    className="inp"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={formatInputDisplay(m.amount)}
                    onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                    className="inp font-mono text-right"
                  />
                </div>
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="mt-2.5 text-gray-300 hover:text-red-500 text-lg leading-none transition"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestone}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              + Add milestone
            </button>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-green-100">
              <span className="text-xs text-gray-400">Total</span>
              <span className="font-mono text-sm font-bold text-gray-900">
                {formatAmount(milestoneTotal)}
              </span>
              <span className="text-xs text-gray-400">FLOW</span>
            </div>
          </div>
        ) : (
          <Field label="Amount (FLOW)">
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={formatInputDisplay(amount)}
              onChange={(e) => setAmount(parseAmountInput(e.target.value))}
              className="inp font-mono"
            />
          </Field>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
        >
          {sending ? "Creating..." : "Create Escrow"}
        </button>
      </form>

      <style>{`
        .inp {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: white;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .inp:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
        }
        .inp::placeholder {
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
