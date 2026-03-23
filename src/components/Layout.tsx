import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Layout() {
  const { user, logIn, logOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white">
      {/* Navbar */}
      <nav className="border-b border-green-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight text-green-700 shrink-0">
            Flow<span className="text-gray-900">Lance</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-500 hover:text-green-700 transition"
            >
              My Escrows
            </Link>
            <WalletButton user={user} logIn={logIn} logOut={logOut} />
          </div>

          {/* Mobile: wallet + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user.loggedIn && (
              <button
                onClick={() => navigator.clipboard.writeText(user.addr ?? "")}
                className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-mono text-green-700"
                title="Copy address"
              >
                {user.addr?.slice(0, 6)}..{user.addr?.slice(-3)}
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-green-100 bg-white px-4 py-3 space-y-3">
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-green-700"
            >
              My Escrows
            </Link>
            <div className="pt-2 border-t border-gray-100">
              {user.loggedIn ? (
                <button
                  onClick={() => { logOut(); setMenuOpen(false); }}
                  className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => { logIn(); setMenuOpen(false); }}
                  className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function WalletButton({
  user,
  logIn,
  logOut,
}: {
  user: { loggedIn?: boolean; addr?: string | null };
  logIn: () => void;
  logOut: () => void;
}) {
  if (user.loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(user.addr ?? "")}
          className="rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-mono text-green-700 hover:bg-green-100 transition cursor-pointer"
          title="Copy address"
        >
          {user.addr?.slice(0, 6)}...{user.addr?.slice(-4)}
        </button>
        <button
          onClick={logOut}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={logIn}
      className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition"
    >
      Connect Wallet
    </button>
  );
}
