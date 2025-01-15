import { z } from 'zod';

export class CreatePriceRequest {
  prices: number;
  type_id: string;

  constructor({ prices, type_id }) {
    this.prices = prices;
    this.type_id = type_id;
  }

  static schema() {
    return z.object({
      prices: z.number().positive(),
      type_id: z.string().uuid(),
    });
  }
}
