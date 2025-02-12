import { z } from 'zod';

export class CreatePriceRequest {
  price: number;
  type_id: string;
  date: Date;

  constructor({ price, type_id, date }) {
    this.price = parseFloat(price);
    this.type_id = type_id;
    this.date = new Date(date);
  }

  static schema() {
    return z.object({
      price: z.number().positive(),
      type_id: z.string().uuid(),
      date: z.date(),
    });
  }
}
