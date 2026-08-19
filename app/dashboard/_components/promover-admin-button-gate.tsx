"use client";

import { useEffect, useState } from "react";
import { ACESSO_NEGADO_STORAGE_KEY } from "./acesso-negado-toast";
import { PromoverAdminButton } from "./promover-admin-button";

export function PromoverAdminButtonGate() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(sessionStorage.getItem(ACESSO_NEGADO_STORAGE_KEY) === "1");
  }, []);

  if (!visivel) {
    return null;
  }

  return <PromoverAdminButton />;
}
