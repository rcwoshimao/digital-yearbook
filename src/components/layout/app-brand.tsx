import Image from "next/image";
import Link from "next/link";

type AppBrandProps = {
  className?: string;
  href?: string;
  iconSize?: number;
  titleClassName?: string;
};

const defaultClassName = "inline-flex items-center gap-2.5 text-xl font-black tracking-tight";

export function AppBrand({
  className = defaultClassName,
  href = "/dashboard",
  iconSize = 36,
  titleClassName,
}: AppBrandProps) {
  const label = (
    <>
      <Image
        alt=""
        className="shrink-0 rounded-md"
        height={iconSize}
        priority
        src="/assets/icon.png"
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
