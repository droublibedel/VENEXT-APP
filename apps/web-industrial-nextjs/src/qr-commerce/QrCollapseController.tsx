"use client";

import { useCallback, useState } from "react";

export function useQrCollapse(initial = true) {
  const [collapsed, setCollapsed] = useState(initial);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return { collapsed, setCollapsed, toggle };
}
