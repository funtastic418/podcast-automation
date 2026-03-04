export type EpisodeStatus =
  | "pending"
  | "generating_script"
  | "generating_audio"
  | "uploading_audio"
  | "published"
  | "failed";

export const PIPELINE_STEPS = [
  { key: "generating_script", label: "Generating Script" },
  { key: "generating_audio", label: "Generating Audio" },
  { key: "uploading_audio", label: "Uploading Audio" },
] as const;

export const STATUS_COLORS: Record<EpisodeStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  generating_script: "bg-blue-100 text-blue-800",
  generating_audio: "bg-blue-100 text-blue-800",
  uploading_audio: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export const STATUS_LABELS: Record<EpisodeStatus, string> = {
  pending: "Pending",
  generating_script: "Generating Script",
  generating_audio: "Generating Audio",
  uploading_audio: "Uploading Audio",
  published: "Published",
  failed: "Failed",
};
