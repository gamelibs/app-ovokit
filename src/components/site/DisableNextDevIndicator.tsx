"use client";

import { useEffect } from "react";

export function DisableNextDevIndicator() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    fetch("/__nextjs_disable_dev_indicator", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}

