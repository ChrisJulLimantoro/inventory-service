import { z } from 'zod';

export class CreateCompanyRequest {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  deleted_at: Date | null;

  constructor({ id, name, code, owner_id, deleted_at }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.owner_id = owner_id;
    this.deleted_at = deleted_at;
  }

  static schema() {
    return z.object({
      id: z.string().uuid(),
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      owner_id: z.string().uuid(),
      deleted_at: z.coerce.date().nullable().optional(),
    });
  }
}
