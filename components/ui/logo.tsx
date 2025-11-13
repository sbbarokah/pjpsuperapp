import logopjp from "@/assets/logos/pjp_logo_clean.png";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-8 max-w-[10.847rem]">
      <Image
        src={logopjp}
        fill
        alt="PJP logo"
        role="presentation"
        quality={100}
        objectFit="contain"
      />
    </div>
  );
}