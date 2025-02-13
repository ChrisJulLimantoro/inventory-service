import { z } from 'zod';

export class UpdateOperationRequest {
  code: string | null;
  name: string | null;
  price: number | null;
  uom: string | null;
  description: string | null;
  account_id: string | null;

  constructor({ code, name, price, uom, description, account_id }) {
    this.code = code;
    this.name = name;
    this.price = price;
    this.uom = uom;
    this.description = description;
    this.account_id = account_id;
  }

  static schema() {
    return z.object({
      code: z.string().max(15).optional(),
      name: z.string().min(3).max(255).optional(),
      price: z.number().nonnegative().optional(),
      uom: z.string().max(15).optional(),
      description: z.string().max(255).nullable().optional(),
      account_id: z.string().uuid().optional().nullable(),
    });
  }
}
