"use client";

import type { ComponentProps } from "react";

/** A filter <select> that applies itself as soon as it changes, so phones need no extra tap. */
export function AutoSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
