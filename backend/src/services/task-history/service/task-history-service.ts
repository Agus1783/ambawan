import { TaskHistoryRepository } from '../repositories/task-history-repository';

export const TaskHistoryService = {
  async listTaskHistory(taskId: string) {
    const rows = await TaskHistoryRepository.listHistoryByTask(taskId);
    const users = await TaskHistoryRepository.findUsersByIds([
      ...new Set(rows.map((r) => r.userId)),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    // Respons memakai camelCase sesuai contoh spec §15.1.
    return rows.map((row) => {
      const user = userById.get(row.userId);
      return {
        id: row.id,
        action: row.action,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        description: row.description,
        user: user ? { id: user.id, name: user.name } : null,
        createdAt: row.createdAt,
      };
    });
  },
};
