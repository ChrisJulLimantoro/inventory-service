import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';
export class CreateProductCodeDto {
  barcode: string;
  product_id: string;
  status: number;
  weight: number;
  image: string;
  fixed_price: number;
  buy_price: number;
  tax_purchase: number | null;
  account_id: string;

  constructor({
    barcode,
    product_id,
    status,
    weight,
    fixed_price,
    buy_price,
    tax_purchase,
    account_id,
    image,
  }) {
    this.barcode = barcode;
    this.product_id = product_id;
    this.status = status;
    this.weight = parseFloat(weight);
    this.image = image;
    this.fixed_price = parseFloat(fixed_price);
    this.buy_price = parseFloat(buy_price);
    this.tax_purchase = parseFloat(tax_purchase);
    this.account_id = account_id;
  }

  static schema() {
    return z.object({
      barcode: z.string().max(25),
      product_id: z.string().uuid(),
      status: z.number().optional(),
      weight: z.number(),
      image: z.string(),
      fixed_price: z.number(),
      buy_price: z.number(),
      tax_purchase: z.number().nullable().optional(),
      account_id: z
        .string({
          message: 'Kas/Bank is required',
        })
        .uuid(),
    });
  }
}
