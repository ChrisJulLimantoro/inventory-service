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
  tax_purchase?: number;
  account_id: string;
  certificate_link?: string;
  is_active: boolean;

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
    certificate_link,
    is_active = true,
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
    this.certificate_link = certificate_link;
    this.is_active = is_active;
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
      certificate_link: z.string().nullable().optional(),
      is_active: z.boolean(),
    });
  }
}
