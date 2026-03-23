import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEscrows } from "../hooks/useEscrows";
import EscrowCard from "../components/EscrowCard";
import { addrMatch } from "../lib/format";
import type { Escrow } from "../lib/types";

type Tab = "client" | "freelancer";

export default function Dashboard() {
  const { user } = useAuth();
  const { escrows, loading, fetchAll } = useEscrows();
  const [tab, setTab] = useState<Tab>("client");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!user.loggedIn) {
    return (
      <div className="py-20 text-center text-gray-500">
        Connect your wallet to view your escrows.
      </div>
    );
  }

  const addr = user.addr;
  const clientEscrows: Escrow[] = escrows.filter((e) => addrMatch(e.client, addr));
  const freelancerEscrows: Escrow[] = escrows.filter((e) => addrMatch(e.freelancer, addr));
  const displayed = tab === "client" ? clientEscrows : freelancerEscrows;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Escrows</h1>
        <Link
          to="/create"
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition shadow-sm"
        >
          + New Escrow
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl bg-gray-100/80 p-1 w-fit">
        <TabButton active={tab === "client"} onClick={() => setTab("client")}>
          As Client ({clientEscrows.length})
        </TabButton>
        <TabButton active={tab === "freelancer"} onClick={() => setTab("freelancer")}>
          As Freelancer ({freelancerEscrows.length})
        </TabButton>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            {tab === "client" ? (
              <>
                No escrows yet.{" "}
                <Link to="/create" className="text-green-600 font-medium hover:underline">
                  Create one
                </Link>
              </>
            ) : (
              "No jobs assigned to you yet."
            )}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((e) => (
            <EscrowCard key={e.id} escrow={e} role={tab} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-white text-green-700 shadow-sm"
          : "text-gray-500 hover:text-green-700"
      }`}
    >
      {children}
    </button>
  );
}
