import { TFunction } from "i18next";

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Format date to relative time string
 * @param dateString - ISO date string or Date object
 * @param t - Translation function
 * @param i18n - i18n instance with language property
 * @returns Formatted string like "2 hours ago" or actual date for older dates
 */
export const formatDate = (
  dateString: string | Date,
  t: TFunction,
  i18n: { language: string }
): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return t("saveFile.timeAgo.minutes", { count: diffMinutes });
  } else if (diffHours < 24) {
    return t("saveFile.timeAgo.hours", { count: diffHours });
  } else if (diffDays < 7) {
    return t("saveFile.timeAgo.days", { count: diffDays });
  } else {
    const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: i18n.language === "vi" ? "numeric" : "short",
      day: "numeric",
    });
  }
};

/**
 * Format date to "time ago" format for all time ranges
 * @param date - Date object
 * @param t - Translation function
 * @returns Formatted string like "2 hours" or "3 days"
 */
export const formatDistanceToNow = (date: Date, t: TFunction): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} ${t(diffDays === 1 ? "restoreModal.day" : "restoreModal.days")}`;
  } else if (diffHours > 0) {
    return `${diffHours} ${t(diffHours === 1 ? "restoreModal.hour" : "restoreModal.hours")}`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} ${t(diffMinutes === 1 ? "restoreModal.minute" : "restoreModal.minutes")}`;
  } else {
    return `${diffSeconds} ${t(diffSeconds === 1 ? "restoreModal.second" : "restoreModal.seconds")}`;
  }
};

/**
 * Get display name for save file
 * @param fileName - Backup file name
 * @param t - Translation function
 * @param i18n - i18n instance with language property
 * @returns User-friendly display name
 */
export const getDisplayName = (
  fileName: string,
  t: TFunction,
  i18n: { language: string }
): string => {
  // Extract timestamp from backup filename
  const match = fileName.match(/backup_(\d{8})_(\d{6})/);
  if (match) {
    const dateStr = match[1];
    const timeStr = match[2];
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const hour = timeStr.slice(0, 2);
    const minute = timeStr.slice(2, 4);

    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

    // Format date based on current locale
    const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
    const formattedDate = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: i18n.language === "vi" ? "numeric" : "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);

    return t("saveFile.saveFrom", { date: formattedDate });
  }
  return fileName;
};

/**
 * Format time ago with customizable translation keys
 * @param date - Date string or Date object
 * @param t - Translation function
 * @param translationKeyPrefix - Prefix for translation keys (e.g., "history.backup.timeAgo")
 * @returns Formatted time ago string
 */
export const formatTimeAgo = (
  date: string | Date,
  t: TFunction,
  translationKeyPrefix = "history.backup.timeAgo"
): string => {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return t(`${translationKeyPrefix}.lessThanAMinute`);
  } else if (diffInMinutes < 60) {
    return t(`${translationKeyPrefix}.minutes`, { count: diffInMinutes });
  } else if (diffInMinutes < 60 * 24) {
    const diffInHours = Math.floor(diffInMinutes / 60);
    return t(`${translationKeyPrefix}.hours`, { count: diffInHours });
  } else if (diffInMinutes < 60 * 24 * 7) {
    const diffInDays = Math.floor(diffInMinutes / (60 * 24));
    return t(`${translationKeyPrefix}.days`, { count: diffInDays });
  } else if (diffInMinutes < 60 * 24 * 30) {
    const diffInWeeks = Math.floor(diffInMinutes / (60 * 24 * 7));
    return t(`${translationKeyPrefix}.weeks`, { count: diffInWeeks });
  } else {
    const diffInMonths = Math.floor(diffInMinutes / (60 * 24 * 30));
    return t(`${translationKeyPrefix}.months`, { count: diffInMonths });
  }
};