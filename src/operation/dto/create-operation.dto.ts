import { z } from 'zod';

export class CreateOperationRequest {
  code: string;
  name: string;
  price: number;
  uom: string;
  description: string | null;
  store_id: string;
  account_id: string | null;

  constructor({ name, code, price, uom, description, store_id, account_id }) {
    this.name = name;
    this.code = code;
    this.price = price;
    this.uom = uom;
    this.description = description;
    this.store_id = store_id;
    this.account_id = account_id;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(15),
      price: z.number().nonnegative(),
      uom: z.string().max(15),
      description: z.string().max(255).nullable().optional(),
      store_id: z.string().uuid(),
      account_id: z.string().uuid().nullable().optional(),
    });
  }
}
