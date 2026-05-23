"use client";

import { useCallback, useEffect, useState } from "react";

const LS_BW = "venext_low_bandwidth";
const LS_ANIM = "venext_low_animation";

export type AdaptiveQuality = {
  lowBandwidth: boolean;
  lowAnimation: boolean;
  setLowBandwidth: (v: boolean) => void;
  setLowAnimation: (v: boolean) => void;
};

/** Instruction 5 §9 — adaptive quality for low-RAM / unstable links. */
export function useAdaptiveQualityMode(): AdaptiveQuality {
  const [lowBandwidth, setLowBandwidthState] = useState(false);
  const [lowAnimation, setLowAnimationState] = useState(false);

  useEffect(() => {
    setLowBandwidthState(localStorage.getItem(LS_BW) === "1");
    setLowAnimationState(localStorage.getItem(LS_ANIM) === "1");
  }, []);

  const setLowBandwidth = useCallback((v: boolean) => {
    setLowBandwidthState(v);
    localStorage.setItem(LS_BW, v ? "1" : "0");
  }, []);

  const setLowAnimation = useCallback((v: boolean) => {
    setLowAnimationState(v);
    localStorage.setItem(LS_ANIM, v ? "1" : "0");
  }, []);

  return { lowBandwidth, lowAnimation, setLowBandwidth, setLowAnimation };
}
