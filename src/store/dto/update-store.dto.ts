import { z } from 'zod';

export class UpdateStoreRequest {
  name: string | null;
  code: string | null;
  company_id: string | null;

  constructor({ name, code, company_id }) {
    this.name = name;
    this.code = code;
    this.company_id = company_id;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).optional(),
      code: z.string().max(5).optional(),
      company_id: z.string().uuid().optional(),
    });
  }
}
