import Image from "next/image";
import { DIMS } from "@/lib/dims";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  contain?: boolean;
  eager?: boolean;
};

/** next/image with the intrinsic size looked up from DIMS. `fill` covers its positioned parent. */
export function Pic({ src, alt, className = "", sizes = "100vw", priority, fill, contain, eager }: Props) {
  const loading = priority ? undefined : eager ? "eager" : undefined;
  if (fill) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} loading={loading} className={`${contain ? "object-contain" : "object-cover"} ${className}`} />;
  }
  const [w, h] = DIMS[src] ?? [1200, 800];
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes}
      priority={priority}
      loading={loading}
      className={`h-auto w-full ${className}`}
      draggable={false}
    />
  );
}
