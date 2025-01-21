import { z } from 'zod';

export class UpdateProductRequest {
  name: string | null;
  code: string | null;
  description: string | null;
  fixed_price: number | null;
  images: string[] | null;

  constructor({ name, code, description, fixed_price, images }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.fixed_price = fixed_price;
    this.images = images;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).nullable().optional(),
      code: z.string().max(8).nullable().optional(),
      description: z.string().max(255).nullable().optional(),
      fixed_price: z.number().nullable().optional(),
      images: z.array(z.string()).nullable().optional(),
    });
  }
}
