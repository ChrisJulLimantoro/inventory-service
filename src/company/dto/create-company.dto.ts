import { z } from 'zod';

export class CreateCompanyRequest {
  id: string;
  name: string;
  code: string;
  owner_id: string;

  constructor({ id, name, code, owner_id }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.owner_id = owner_id;
  }

  static schema() {
    return z.object({
      id: z.string().uuid(),
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      owner_id: z.string().uuid(),
    });
  }
}
