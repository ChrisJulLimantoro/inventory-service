import { z } from 'zod';

export class CreateProductRequest {
  name: string;
  code: string;
  description: string | null;
  price: number;
  type_id: string;
  store_id: string;

  constructor({ name, code, description, price, type_id, store_id }) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.price = price;
    this.type_id = type_id;
    this.store_id = store_id;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      description: z.string().max(255).nullable().optional(),
      price: z.number(),
      type_id: z.string().uuid(),
      store_id: z.string().uuid(),
    });
  }
}
