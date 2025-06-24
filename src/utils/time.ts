import { TFunction } from "i18next";

export const formatBackupTime = (
  timestamp: number | null,
  t: TFunction
): string => {
  if (!timestamp) {
    return t("gameUI.backup.never");
  }

  const date = new Date(timestamp);

  // Format: "DD/MM/YYYY HH:mm"
  const formattedDate = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formattedDate} ${formattedTime}`;
};
