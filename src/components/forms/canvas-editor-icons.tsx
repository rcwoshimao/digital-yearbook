type IconProps = {
  className?: string;
};

const iconClass = "h-5 w-5";

export function IconSelect({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 13l6 6" />
    </svg>
  );
}

export function IconEraser({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 21h10M5.5 14.5l7-7 4 4-7 7H5.5v-4zM15.5 6.5l2-2a2.12 2.12 0 013 3l-2 2"
      />
    </svg>
  );
}

export function IconPen({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
      />
    </svg>
  );
}

export function IconText({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}

export function IconImage({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect strokeLinecap="round" strokeLinejoin="round" x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function IconSticker({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75L5 16zM19 14l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5.5-1.5z"
      />
    </svg>
  );
}

export function IconBackground({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20h16M6 16l6-12 6 12M8 12h8"
      />
    </svg>
  );
}

export function IconBackgroundImage({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 14l1-1a2 2 0 012.828 0L20 14" />
      <rect strokeLinecap="round" strokeLinejoin="round" x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  );
}

export function IconUndo({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H12" />
    </svg>
  );
}

export function IconRedo({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H12" />
    </svg>
  );
}

export function IconSave({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

export function IconReset({ className = iconClass }: IconProps) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
    </svg>
  );
}
