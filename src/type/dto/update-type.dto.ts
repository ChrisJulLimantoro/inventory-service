import { z } from 'zod';

export class UpdateTypeRequest {
  name: string;
  code: string;
  description: string | null;

  constructor({ name, code, description }) {
    this.name = name;
    this.code = code;
    this.description = description;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      description: z.string().max(255).nullable().optional(),
    });
  }
}
