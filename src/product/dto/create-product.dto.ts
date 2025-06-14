import { z } from 'zod';

export class CreateProductRequest {
  name: string;
  code: string;
  description: string | null;
  tags: string[];
  type_id: string;
  store_id: string;
  status: number;

  constructor({ name, code, description, tags, type_id, store_id }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.tags = tags;
    this.type_id = type_id;
    this.store_id = store_id;
    this.status = 1;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(25),
      description: z.string().max(255).nullable().optional(),
      tags: z.array(z.string()).optional(),
      type_id: z.string().uuid(),
      store_id: z.string().uuid(),
      status: z.number().optional(),
    });
  }
}
