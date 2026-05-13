"use client";

import { useEffect } from "react";
import { initDemoDataIfEmpty } from "@/services/demoDataStorage";

export default function DemoDataInitializer() {
  useEffect(() => {
    initDemoDataIfEmpty();
  }, []);

  return null;
}
