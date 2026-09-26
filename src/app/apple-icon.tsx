import { ImageResponse } from "next/og";
import { AppIcon } from "./app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS rounds the corners itself, so fill the square.
  return new ImageResponse(
    <div style={{ width: 180, height: 180, display: "flex", background: "#0f9d58" }}>
      <AppIcon size={180} />
    </div>,
    size,
  );
}
