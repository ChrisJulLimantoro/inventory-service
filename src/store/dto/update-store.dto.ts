import { z } from 'zod';

export class UpdateStoreRequest {
  name: string | null;
  code: string | null;
  company_id: string | null;
  is_active: boolean | null;
  is_float_price: boolean | null;
  is_flex_price: boolean | null;
  tax_percentage: number | null;

  constructor({
    name,
    code,
    company_id,
    is_active,
    is_float_price,
    is_flex_price,
    tax_percentage,
  }) {
    this.name = name;
    this.code = code;
    this.company_id = company_id;
    this.is_active = is_active;
    this.is_float_price = is_float_price;
    this.is_flex_price = is_flex_price;
    this.tax_percentage = parseFloat(tax_percentage);
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).optional(),
      code: z.string().max(5).optional(),
      company_id: z.string().uuid().optional(),
      is_active: z.boolean().optional(),
      is_float_price: z.boolean().optional(),
      is_flex_price: z.boolean().optional(),
      tax_percentage: z.number().min(0).max(100).optional(),
    });
  }
}
