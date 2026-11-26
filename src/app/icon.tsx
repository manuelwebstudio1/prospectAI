import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f1eb",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {petals.map((deg) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                width: 6,
                height: 12,
                borderRadius: 999,
                background: "#e85a2a",
                transform: `rotate(${deg}deg) translateY(-5px)`,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
