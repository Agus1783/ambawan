/**
 * Penambahan field pada Express Request:
 * - `req.user` diisi middleware auth (ID user dari JWT).
 * - `req.validated` diisi middleware validate (hasil parse Zod).
 * - `req.workspace` diisi middleware authorize (workspace aktif
 *   beserta role dan izin pemanggil di workspace tersebut).
 * - `req.project` diisi middleware authorizeProject (proyek aktif
 *   beserta role dan izin pemanggil DI PROYEK tersebut).
 *   `req.workspace` hanya diisi bila pemanggil juga anggota
 *   workspace; anggota proyek saja (bukan anggota workspace)
 *   tidak mendapat `req.workspace`.
 */
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      validated?: unknown;
      workspace?: {
        id: string;
        roleId: string;
        roleName: string;
        permissions: string[];
      };
      project?: {
        id: string;
        workspaceId: string;
        roleId: string;
        roleName: string;
        permissions: string[];
      };
    }
  }
}

export {};
