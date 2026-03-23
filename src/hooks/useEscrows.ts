import { useState, useCallback } from "react";
import { fcl } from "../lib/flow";
import * as t from "@onflow/types";
import { GET_ALL_ESCROWS, GET_ESCROW } from "../lib/cadence";
import type { Escrow, Milestone } from "../lib/types";
import type { RawChainData, CadenceArg } from "../lib/fcl-types";

function normalizeEscrow(raw: RawChainData): Escrow {
  return {
    id: Number(raw.id),
    client: raw.client,
    freelancer: raw.freelancer,
    amount: raw.amount,
    status: Number(raw.status),
    title: raw.title,
    description: raw.description ?? "",
    deliverableURI: raw.deliverableURI ?? null,
    createdAt: raw.createdAt,
    deadline: raw.deadline ?? null,
    milestones: (raw.milestones ?? []).map(normalizeMilestone),
  };
}

function normalizeMilestone(raw: RawChainData): Milestone {
  return {
    id: Number(raw.id),
    title: raw.title,
    amount: raw.amount,
    status: Number(raw.status),
  };
}

export function useEscrows() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fcl.query({ cadence: GET_ALL_ESCROWS });
      setEscrows((result ?? []).map(normalizeEscrow));
    } catch (err) {
      console.error("Failed to fetch escrows:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: number): Promise<Escrow | null> => {
    try {
      const result = await fcl.query({
        cadence: GET_ESCROW,
        args: (arg: CadenceArg) => [arg(String(id), t.UInt64)],
      });
      return result ? normalizeEscrow(result) : null;
    } catch (err) {
      console.error("Failed to fetch escrow:", err);
      return null;
    }
  }, []);

  return { escrows, loading, fetchAll, fetchOne };
}
