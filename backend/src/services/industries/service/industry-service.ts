import { IndustryRepository } from '../repositories/industry-repository';
import {
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';
import { hasPermissionAnywhere } from '../../../utils/permissions';
import type { CreateIndustryInput } from '../validator/schema';

function toIndustryResponse(row: {
  id: string;
  name: string;
  description: string | null;
  createdBy: string | null;
}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    is_system: row.createdBy === null,
  };
}

export const IndustryService = {
  async listIndustries(query: {
    page: number;
    limit: number;
    search?: string | undefined;
  }) {
    const [rows, total] = await Promise.all([
      IndustryRepository.list({
        search: query.search,
        limit: query.limit,
        offset: offsetOf(query.page, query.limit),
      }),
      IndustryRepository.count({ search: query.search }),
    ]);
    return {
      items: rows.map(toIndustryResponse),
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async createIndustry(userId: string, input: CreateIndustryInput) {
    // Izin dicek terhadap SALAH SATU workspace yang diikuti pemanggil
    // (spec §9.2: industri bersifat global, tidak terikat satu workspace).
    const allowed = await hasPermissionAnywhere(
      userId,
      'workspace.manage_industries',
    );
    if (!allowed) {
      throw new AuthorizationError('Tidak memiliki permission', 'FORBIDDEN');
    }

    // Nama boleh sama antar pemilik, tapi tidak untuk pemilik yang sama.
    const existing = await IndustryRepository.findByNameAndCreator(
      input.name,
      userId,
    );
    if (existing) {
      throw new InvariantError(
        'Nama bidang usaha sudah ada untuk pemilik yang sama',
        'RESOURCE_CONFLICT',
      );
    }

    const created = await IndustryRepository.create({
      name: input.name,
      description: input.description,
      createdBy: userId,
    });
    return toIndustryResponse(created);
  },

  async getProjectSuggestions(industryId: string) {
    const industry = await IndustryRepository.findById(industryId);
    if (!industry) {
      throw new NotFoundError(
        'Bidang usaha tidak ditemukan',
        'INDUSTRY_NOT_FOUND',
      );
    }
    const templates =
      await IndustryRepository.findSystemTemplatesByIndustry(industryId);
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      industry: { id: industry.id, name: industry.name },
    }));
  },
};
