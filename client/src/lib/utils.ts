import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getFileIconClass(fileType: string): string {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return 'fas fa-file-pdf text-red-500';
  if (type.includes('word') || type.includes('doc')) return 'fas fa-file-word text-blue-500';
  if (type.includes('excel') || type.includes('sheet') || type.includes('csv') || type.includes('xls')) return 'fas fa-file-excel text-green-500';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'fas fa-file-powerpoint text-orange-500';
  if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) return 'fas fa-file-image text-purple-500';
  return 'fas fa-file text-gray-500';
}

export function getStatusColor(status: string): {bgColor: string, textColor: string} {
  switch (status) {
    case 'Završeno':
      return { bgColor: 'bg-green-100', textColor: 'text-green-800' };
    case 'U toku':
      return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'Zakazano':
      return { bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
