"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_PRODUCER_POLE,
  isProducerPoleId,
  type ProducerPoleId,
} from "../navigation/producer-navigation.config";

export function useProducerPoleNavigation(initial?: ProducerPoleId) {
  const [activePole, setActivePole] = useState<ProducerPoleId>(initial ?? DEFAULT_PRODUCER_POLE);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectPole = useCallback((id: ProducerPoleId) => {
    setActivePole(id);
  }, []);

  const selectPoleFromString = useCallback((value: string) => {
    if (isProducerPoleId(value)) setActivePole(value);
  }, []);

  return {
    activePole,
    selectPole,
    selectPoleFromString,
    mobileNavOpen,
    setMobileNavOpen,
    closeMobileNav: () => setMobileNavOpen(false),
  };
}
