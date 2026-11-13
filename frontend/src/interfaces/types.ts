export interface NavItem {
  id: string
  icon: string
  label: string
}

export type PageId = 'dashboard' | 'projects' | 'tasks' | 'taskDetail' | 'delegation' | 'organization' | 'myTasks';

export type RoleName = 'ADMIN' | 'MANAGER' | 'DIVISION_LEADER' | 'MEMBER';

export type TaskStatus =
  | 'BACKLOG'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED';

export type Priority = 'P1' | 'P2' | 'P3';

export interface Division {
  id: string;
  name: string;
  leaderId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  divisionId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  divisionId: string | null;
  assigneeId: string | null;
}

export interface HistoryItem {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  description: string | null;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
}
