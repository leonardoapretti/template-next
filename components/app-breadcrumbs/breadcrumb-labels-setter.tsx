"use client";

import { useEffect } from "react";
import { type BreadcrumbLabels, useBreadcrumbLabels } from "./breadcrumb-labels-context";

type BreadcrumbLabelsSetterProps = {
  labels: BreadcrumbLabels;
};

export function BreadcrumbLabelsSetter({ labels }: BreadcrumbLabelsSetterProps) {
  const { setLabels, clearLabels } = useBreadcrumbLabels();

  useEffect(() => {
    setLabels(labels);

    return () => {
      clearLabels();
    };
  }, [labels, setLabels, clearLabels]);

  return null;
}
