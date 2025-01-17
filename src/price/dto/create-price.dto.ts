import { z } from 'zod';

export class CreatePriceRequest {
  price: number;
  type_id: string;

  constructor({ price, type_id }) {
    this.price = price;
    this.type_id = type_id;
  }

  static schema() {
    return z.object({
      price: z.number().positive(),
      type_id: z.string().uuid(),
    });
  }
}
