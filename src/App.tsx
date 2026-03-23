import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreateEscrow from "./pages/CreateEscrow";
import EscrowDetail from "./pages/EscrowDetail";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateEscrow />} />
        <Route path="/escrow/:id" element={<EscrowDetail />} />
      </Route>
    </Routes>
  );
}
