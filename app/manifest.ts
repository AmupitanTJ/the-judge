import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Judge — Nigerian Legal Intelligence",
    short_name: "The Judge",
    description: "Source-backed Nigerian legal research for practitioners and the public.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    icons: [
      {
        src: "/brand/the-judge-official-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
