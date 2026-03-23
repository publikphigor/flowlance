import { useState, useEffect } from "react";
import { fcl } from "../lib/flow";

interface FlowUser {
  loggedIn?: boolean;
  addr?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<FlowUser>({ loggedIn: false, addr: null });

  useEffect(() => {
    fcl.currentUser.subscribe((u: FlowUser) => setUser(u));
  }, []);

  const logIn = () => fcl.authenticate();
  const logOut = () => fcl.unauthenticate();

  return { user, logIn, logOut };
}
