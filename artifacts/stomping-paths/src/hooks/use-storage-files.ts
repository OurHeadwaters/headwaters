import { useQuery } from "@tanstack/react-query";

export type FileType = "pdf" | "video" | "image" | "other";

export type StorageFile = {
  key: string;
  name: string;
  type: FileType;
  sizeBytes: number;
  sizeLabel: string;
  contentType: string;
  uploadedAt: string | null;
  url: string;
  title: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
};

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export function useStorageFiles() {
  return useQuery<StorageFile[]>({
    queryKey: ["storage-files"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/storage/files"));
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}
