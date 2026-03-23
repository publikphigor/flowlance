import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Landing() {
  const { user, logIn } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-green-700">
          Flow<span className="text-gray-900">Lance</span>
        </span>
        {user.loggedIn ? (
          <Link
            to="/dashboard"
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Go to App
          </Link>
        ) : (
          <button
            onClick={logIn}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Connect Wallet
          </button>
        )}
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-green-100/60 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-green-50 blur-3xl" />
        </div>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-1.5 text-sm font-medium text-green-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Built on Flow Blockchain
        </div>

        <h1 className="max-w-2xl text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900">
          Freelance payments,{" "}
          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            trustless & instant
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-500">
          FlowLance holds funds in a smart contract until the job is done.
          No middlemen, no chargebacks — just safe, transparent escrow.
        </p>

        <div className="mt-10 flex gap-4">
          {user.loggedIn ? (
            <Link
              to="/dashboard"
              className="rounded-xl bg-green-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-600/20 hover:bg-green-700 hover:shadow-green-600/30 transition-all"
            >
              Launch App
            </Link>
          ) : (
            <button
              onClick={logIn}
              className="rounded-xl bg-green-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-600/20 hover:bg-green-700 hover:shadow-green-600/30 transition-all"
            >
              Connect Wallet to Start
            </button>
          )}
        </div>

        {/* How it works */}
        <div className="mt-24 w-full max-w-3xl">
          <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-400">
            How it works
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FeatureCard
              step="01"
              title="Create & Fund"
              description="Set the job scope, amount, and freelancer. Lock FLOW tokens into the escrow contract."
            />
            <FeatureCard
              step="02"
              title="Work & Deliver"
              description="Freelancer accepts, starts work, and submits deliverables. Track progress with milestones."
            />
            <FeatureCard
              step="03"
              title="Confirm & Pay"
              description="Client reviews and confirms. Funds release directly to the freelancer's wallet."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400 font-mono">
        FlowLance Escrow — PL_Genesis Hackathon 2026
      </footer>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm transition hover:shadow-md hover:border-green-200">
      <span className="font-mono text-xs font-bold text-green-400">{step}</span>
      <h3 className="mt-2 font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}
