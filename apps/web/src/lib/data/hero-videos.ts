export interface HeroVideo {
  id: string;
  src: string;
  poster: string;
  /** Approximate duration in seconds (used before metadata loads). */
  durationSec?: number;
}

export const heroVideos: HeroVideo[] = [
  { id: "01", src: "/videos/hero/clip-01.mp4", poster: "/videos/hero/clip-01.jpg", durationSec: 21 },
  { id: "02", src: "/videos/hero/clip-02.mp4", poster: "/videos/hero/clip-02.jpg", durationSec: 18 },
  { id: "03", src: "/videos/hero/clip-03.mp4", poster: "/videos/hero/clip-03.jpg", durationSec: 15 },
  { id: "04", src: "/videos/hero/clip-04.mp4", poster: "/videos/hero/clip-04.jpg", durationSec: 14 },
  { id: "05", src: "/videos/hero/clip-05.mp4", poster: "/videos/hero/clip-05.jpg", durationSec: 12 },
];
