import { z } from 'zod';
export class UpdateProductCodeDto {
  status?: number | null;
  weight?: number | null;
  image?: string;
  fixed_price?: number | null;
  buy_price?: number | null;
  tax_purchase?: number | null;
  certificate_link?: string | null;
  is_active?: boolean | null;

  constructor({
    status,
    weight,
    fixed_price,
    image,
    buy_price,
    tax_purchase,
    certificate_link,
    is_active,
  }) {
    this.status = parseInt(status);
    this.weight = weight ? parseFloat(weight) : undefined;
    this.image = image;
    this.fixed_price = fixed_price ? parseFloat(fixed_price) : undefined;
    this.buy_price = buy_price ? parseFloat(buy_price) : undefined;
    this.tax_purchase = tax_purchase ? parseFloat(tax_purchase) : undefined;
    this.certificate_link = certificate_link;
    this.is_active = is_active;
  }

  static schema() {
    return z.object({
      status: z.number().nullable().optional(),
      weight: z.number().nullable().optional(),
      image: z.string().nullable().optional(),
      buy_price: z.number().nullable().optional(),
      tax_purchase: z.number().nullable().optional(),
      fixed_price: z.number().nullable().optional(),
      certificate_link: z.string().nullable().optional(),
      is_active: z.boolean().nullable().optional(),
    });
  }
}
