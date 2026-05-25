import Image from "next/image";
import Link from "next/link";

type AppBrandProps = {
  className?: string;
  href?: string;
  iconSize?: number;
  iconSrc?: string;
  titleClassName?: string;
};

const defaultClassName = "inline-flex items-center gap-2.5 text-xl font-black tracking-tight";

export function AppBrand({
  className = defaultClassName,
  href = "/dashboard",
  iconSize = 36,
  iconSrc = "/assets/icon.png",
  titleClassName,
}: AppBrandProps) {
  const label = (
    <>
      <Image
        alt=""
        className="shrink-0 rounded-md"
        height={iconSize}
        priority
        src={iconSrc}
        width={iconSize}
      />
      <span className={titleClassName}>Digital Yearbook</span>
    </>
  );

  if (!href) {
    return <div className={className}>{label}</div>;
  }

  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
}
