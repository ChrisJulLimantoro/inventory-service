import { z } from 'zod';

export class CreateStoreRequest {
  id: string;
  code: string;
  name: string;
  company_id: string;
  is_active: boolean;
  is_float_price: boolean;
  is_flex_price: boolean;

  constructor({
    id,
    name,
    code,
    company_id,
    is_active = true,
    is_float_price = false,
    is_flex_price = false,
  }) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.company_id = company_id;
    this.is_active = is_active;
    this.is_float_price = is_float_price;
    this.is_flex_price = is_flex_price;
  }

  static schema() {
    return z.object({
      id: z.string().uuid(),
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      company_id: z.string().uuid(),
      is_active: z.boolean(),
      is_float_price: z.boolean(),
      is_flex_price: z.boolean(),
    });
  }
}
