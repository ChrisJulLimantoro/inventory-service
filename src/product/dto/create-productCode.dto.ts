import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';
export class CreateProductCodeDto {
  barcode: string;
  product_id: string;
  status: number;
  weight: number;
  fixed_price: number;

  constructor({ barcode, product_id, status, weight, fixed_price }) {
    this.barcode = barcode;
    this.product_id = product_id;
    this.status = status;
    this.weight = parseFloat(weight);
    this.fixed_price = parseFloat(fixed_price);
  }

  static schema() {
    return z.object({
      id: z.string().uuid(),
      barcode: z.string().max(5),
      product_id: z.string().uuid(),
      status: z.number().optional(),
      weight: z.number(),
      fixed_price: z.number(),
    });
  }
}
