"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeedItems, DEFAULT_PROFILE } from "./seed";
import type { MerchantProfile, QrItem, ToastState } from "./types";

const ITEMS_KEY = "paycase.codes.v1";
const PROFILE_KEY = "paycase.profile.v1";

type PayCaseState = {
  ready: boolean;
  items: QrItem[];
  profile: MerchantProfile;
  activeItemId: string | null;
  toast: ToastState;
};

type PayCaseContextValue = PayCaseState & {
  sortedItems: QrItem[];
  activeItem: QrItem | null;
  addItem: (item: QrItem) => void;
  updateItem: (id: string, patch: Partial<QrItem>) => void;
  removeItem: (id: string) => void;
  togglePin: (id: string) => void;
  openItem: (id: string) => void;
  closeItem: () => void;
  setProfile: (profile: MerchantProfile) => void;
  restoreDemo: () => Promise<void>;
  clearAll: () => void;
  showToast: (message: string, variant?: NonNullable<ToastState>["variant"]) => void;
};

const PayCaseContext = createContext<PayCaseContextValue | null>(null);

function persistItems(items: QrItem[]) {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch {
    // Quota errors shouldn't crash the demo — the session copy still works.
  }
}

function persistProfile(profile: MerchantProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function PayCaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<QrItem[]>([]);
  const [profile, setProfileState] = useState<MerchantProfile>(DEFAULT_PROFILE);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback(
    (message: string, variant: NonNullable<ToastState>["variant"] = "none") => {
      const id = Date.now();
      setToast({ id, message, variant });
      if (variant !== "loading") {
        window.setTimeout(() => {
          setToast((current) => (current?.id === id ? null : current));
        }, 1800);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const rawItems = localStorage.getItem(ITEMS_KEY);
        const rawProfile = localStorage.getItem(PROFILE_KEY);
        if (rawProfile) {
          setProfileState({ ...DEFAULT_PROFILE, ...JSON.parse(rawProfile) });
        }
        if (rawItems) {
          const parsed = JSON.parse(rawItems) as QrItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (!cancelled) setItems(parsed);
            return;
          }
        }
        const seeded = await buildSeedItems();
        if (!cancelled) {
          setItems(seeded);
          persistItems(seeded);
        }
      } catch {
        const seeded = await buildSeedItems();
        if (!cancelled) setItems(seeded);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const setItemsAndPersist = useCallback((updater: (prev: QrItem[]) => QrItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      persistItems(next);
      return next;
    });
  }, []);

  const addItem = useCallback(
    (item: QrItem) => {
      setItemsAndPersist((prev) => [item, ...prev]);
    },
    [setItemsAndPersist],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<QrItem>) => {
      setItemsAndPersist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [setItemsAndPersist],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItemsAndPersist((prev) => prev.filter((item) => item.id !== id));
      setActiveItemId((current) => (current === id ? null : current));
    },
    [setItemsAndPersist],
  );

  const togglePin = useCallback(
    (id: string) => {
      setItemsAndPersist((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, pinned: !item.pinned } : item,
        ),
      );
    },
    [setItemsAndPersist],
  );

  const setProfile = useCallback((next: MerchantProfile) => {
    setProfileState(next);
    persistProfile(next);
  }, []);

  const restoreDemo = useCallback(async () => {
    showToast("Restoring demo codes…", "loading");
    const seeded = await buildSeedItems();
    setItems(seeded);
    persistItems(seeded);
    setProfileState(DEFAULT_PROFILE);
    persistProfile(DEFAULT_PROFILE);
    setActiveItemId(null);
    showToast("Demo codes restored", "success");
  }, [showToast]);

  const clearAll = useCallback(() => {
    setItemsAndPersist(() => []);
    setActiveItemId(null);
    showToast("Gallery cleared", "success");
  }, [setItemsAndPersist, showToast]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }, [items]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeItemId) ?? null,
    [items, activeItemId],
  );

  const value = useMemo<PayCaseContextValue>(
    () => ({
      ready,
      items,
      profile,
      activeItemId,
      toast,
      sortedItems,
      activeItem,
      addItem,
      updateItem,
      removeItem,
      togglePin,
      openItem: (id: string) => setActiveItemId(id),
      closeItem: () => setActiveItemId(null),
      setProfile,
      restoreDemo,
      clearAll,
      showToast,
    }),
    [
      ready,
      items,
      profile,
      activeItemId,
      toast,
      sortedItems,
      activeItem,
      addItem,
      updateItem,
      removeItem,
      togglePin,
      setProfile,
      restoreDemo,
      clearAll,
      showToast,
    ],
  );

  return <PayCaseContext.Provider value={value}>{children}</PayCaseContext.Provider>;
}

export function usePayCase() {
  const ctx = useContext(PayCaseContext);
  if (!ctx) throw new Error("usePayCase must be used inside PayCaseProvider");
  return ctx;
}
