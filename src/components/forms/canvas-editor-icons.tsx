type IconProps = {
  className?: string;
};

const iconClass = "inline-flex text-xl leading-none";

type FlaticonRoundedIcon = `fi-rr-${string}`;

function flaticonClass(name: FlaticonRoundedIcon, className?: string) {
  return ["fi", name, className].filter(Boolean).join(" ");
}

function FlaticonIcon({
  name,
  className,
}: IconProps & { name: FlaticonRoundedIcon }) {
  return (
    <i
      className={flaticonClass(name, `${iconClass} ${className ?? "text-xl"}`)}
      aria-hidden
    />
  );
}

export function IconSelect({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-cursor" className={className} />;
}

export function IconEraser({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-eraser" className={className} />;
}

export function IconPen({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-pencil" className={className} />;
}

export function IconText({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-blog-text" className={className} />;
}

export function IconImage({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-picture" className={className} />;
}

export function IconSticker({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-sticker" className={className} />;
}

export function IconBackground({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-fill" className={className} />;
}

export function IconBackgroundImage({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-add-image" className={className} />;
}

export function IconUndo({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-undo" className={className} />;
}

export function IconRedo({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-redo" className={className} />;
}

export function IconSave({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-floppy-disks" className={className} />;
}

export function IconTrash({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-trash" className={className} />;
}

export function IconReset({ className = iconClass }: IconProps) {
  return <FlaticonIcon name="fi-rr-rotate-left" className={className} />;
}
