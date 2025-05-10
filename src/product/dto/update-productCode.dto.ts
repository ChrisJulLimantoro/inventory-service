import { z } from 'zod';
export class UpdateProductCodeDto {
  status?: number | null;
  weight?: number | null;
  image?: string;
  fixed_price?: number | null;
  buy_price?: number | null;
  tax_purchase?: number | null;

  constructor({ status, weight, fixed_price, image, buy_price, tax_purchase }) {
    this.status = parseInt(status);
    this.weight = weight ? parseFloat(weight) : undefined;
    this.image = image;
    this.fixed_price = fixed_price ? parseFloat(fixed_price) : undefined;
    this.buy_price = buy_price ? parseFloat(buy_price) : undefined;
    this.tax_purchase = tax_purchase ? parseFloat(tax_purchase) : undefined;
  }

  static schema() {
    return z.object({
      status: z.number().nullable().optional(),
      weight: z.number().nullable().optional(),
      image: z.string().nullable().optional(),
      buy_price: z.number().nullable().optional(),
      tax_purchase: z.number().nullable().optional(),
      fixed_price: z.number().nullable().optional(),
    });
  }
}
