import type { Task } from "../interfaces/types";
import { divisions, projects, users } from "../data/mockData";

export function userName(id: string | null): string {
  if (!id) return "Belum ditentukan";
  return users.find((u) => u.id === id)?.name ?? id;
}

export function divisionName(id: string | null): string {
  if (!id) return "—";
  return divisions.find((d) => d.id === id)?.name ?? id;
}

export function projectName(id: string): string {
  return projects.find((p) => p.id === id)?.name ?? id;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const TODAY = "2026-11-04";

export function isOverdue(t: Task): boolean {
  return (
    t.deadline < TODAY && t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );
}
