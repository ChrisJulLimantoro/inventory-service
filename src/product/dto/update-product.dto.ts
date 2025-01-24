import { z } from 'zod';

export class UpdateProductRequest {
  name: string | null;
  code: string | null;
  description: string | null;
  images: string[] | null;

  constructor({ name, code, description, images }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.images = images;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).nullable().optional(),
      code: z.string().max(8).nullable().optional(),
      description: z.string().max(255).nullable().optional(),
      images: z.array(z.string()).nullable().optional(),
    });
  }
}
