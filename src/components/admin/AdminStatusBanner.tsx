export type AdminFeedback = {
  tone: "error" | "success";
  text: string;
};

type AdminStatusBannerProps = {
  feedback?: AdminFeedback | null;
};

export function AdminStatusBanner({ feedback }: AdminStatusBannerProps) {
  if (!feedback) return null;

  return (
    <p
      className={`admin-status-banner admin-status-banner--${feedback.tone}`}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.text}
    </p>
  );
}
