import Image from "next/image";
import { cn } from "@/lib/utils";
import { DEMO_PHOTO_CAPTION } from "@/components/demos/stock";

export function DemoPhoto({
  src,
  alt,
  className,
  caption = DEMO_PHOTO_CAPTION,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  caption?: string | false;
  priority?: boolean;
}) {
  return (
    <figure className={cn("relative overflow-hidden bg-stone-800", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
      />
      {caption ? (
        <figcaption className="absolute bottom-2 left-2 z-10 max-w-[min(100%-1rem,28rem)] rounded bg-black/65 px-2 py-1 text-[10px] font-medium leading-snug text-white">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
