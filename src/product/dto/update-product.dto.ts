import { z } from 'zod';

export class UpdateProductRequest {
  name: string;
  code: string;
  description: string | null;
  price: number;

  constructor({ name, code, description, price }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.price = price;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      description: z.string().max(255).nullable().optional(),
      price: z.number(),
    });
  }
}
