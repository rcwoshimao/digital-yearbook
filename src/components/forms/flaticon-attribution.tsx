export function FlaticonAttribution({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-[10px] text-stone-400 ${className}`.trim()}>
      Icons by{" "}
      <a
        className="underline hover:text-stone-600"
        href="https://www.flaticon.com/uicons"
        rel="noopener noreferrer"
        target="_blank"
      >
        Flaticon
      </a>
    </p>
  );
}
