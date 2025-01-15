import { z } from 'zod';

export class UpdateProductRequest {
  name: string | null;
  code: string | null;
  description: string | null;
  price: number | null;

  constructor({ name, code, description, price }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.price = price;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).nullable().optional(),
      code: z.string().max(5).nullable().optional(),
      description: z.string().max(255).nullable().optional(),
      price: z.number().nullable().optional(),
    });
  }
}
