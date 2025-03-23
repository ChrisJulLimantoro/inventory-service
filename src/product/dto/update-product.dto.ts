import { z } from 'zod';

export class UpdateProductRequest {
  name: string | null;
  code: string | null;
  description: string | null;
  tags: string[] | null;

  constructor({ name, code, description, tags }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.tags = tags;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).nullable().optional(),
      code: z.string().max(25).nullable().optional(),
      description: z.string().max(255).nullable().optional(),
      tags: z.array(z.string()).nullable().optional(),
    });
  }
}
