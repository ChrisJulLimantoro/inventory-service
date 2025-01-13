import { z } from 'zod';

export class CreateTypeRequest {
  name: string;
  code: string;
  description: string | null;
  category_id: string;

  constructor({ name, code, description, category_id }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.category_id = category_id;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      description: z.string().max(255).nullable().optional(),
      category_id: z.string().uuid(),
    });
  }
}
