import { z } from 'zod';

export class CreateOperationRequest {
  code: string;
  name: string;
  price: number;
  uom: string;
  description: string | null;

  constructor({ name, code, price, uom, description }) {
    this.name = name;
    this.code = code;
    this.price = price;
    this.uom = uom;
    this.description = description;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      price: z.number().nonnegative(),
      uom: z.string().max(5),
      description: z.string().max(255).nullable().optional(),
    });
  }
}
