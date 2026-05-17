type FlashBannerProps = {
  message: string;
  tone?: "error" | "success" | "success-emphasis";
};

export function FlashBanner({ message, tone = "error" }: FlashBannerProps) {
  const className =
    tone === "error"
      ? "mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
      : tone === "success-emphasis"
        ? "mb-6 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800"
        : "mb-6 rounded-2xl bg-green-50 p-4 text-sm text-green-700";

  return <p className={className}>{message}</p>;
}
