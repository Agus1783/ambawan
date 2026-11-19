import { nanoid } from 'nanoid';
import { or } from '@prisma/orm-postgres/orm-client';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type IndustryRow = Scalars<Models.public_Industries>;
export type ProjectTemplateRow = Scalars<Models.public_ProjectTemplates>;

function industriesFiltered(search?: string | undefined) {
  if (!search) {
    return db.orm.public.Industries.where((i) => i.id.isNotNull());
  }
  const pattern = `%${search.replace(/[%_\\]/g, '\\$&')}%`;
  return db.orm.public.Industries.where((i) =>
    or(i.name.ilike(pattern), i.description.ilike(pattern)),
  );
}

export const IndustryRepository = {
  findById(id: string) {
    return db.orm.public.Industries.where((i) =>
      i.id.eq(varchar<26>(id)),
    ).first();
  },

  async list(
    opts: { search?: string | undefined; limit: number; offset: number },
  ): Promise<IndustryRow[]> {
    const rows = await industriesFiltered(opts.search)
      .orderBy((i) => i.name.asc())
      .limit(opts.limit)
      .offset(opts.offset)
      .all();
    return rows;
  },

  async count(opts: { search?: string | undefined }): Promise<number> {
    const result = await industriesFiltered(opts.search).aggregate((a) => ({
      total: a.count(),
    }));
    return result.total;
  },

  findByNameAndCreator(name: string, createdBy: string) {
    return db.orm.public.Industries.where((i) =>
      i.name.eq(varchar<100>(name)),
    )
      .where((i) => i.createdBy.eq(varchar<26>(createdBy)))
      .first();
  },

  create(data: {
    name: string;
    description?: string | undefined;
    createdBy: string;
  }) {
    return db.orm.public.Industries.create({
      id: varchar<26>(nanoid()),
      name: varchar<100>(data.name),
      description: data.description ?? null,
      createdBy: varchar<26>(data.createdBy),
    });
  },

  /** Saran proyek = template sistem untuk bidang ini (spec §9.3).
   *  Template kustom milik workspace tidak ikut. */
  async findSystemTemplatesByIndustry(
    industryId: string,
  ): Promise<ProjectTemplateRow[]> {
    const rows = await db.orm.public.ProjectTemplates.where((t) =>
      t.industryId.eq(varchar<26>(industryId)),
    )
      .where((t) => t.workspaceId.isNull())
      .orderBy((t) => t.name.asc())
      .all();
    return rows;
  },
};
