import { z } from 'zod';

export class CreateCategoryRequest {
  name: string;
  code: string;
  purity: string;
  metal_type: number;
  description: string | null;
  company_id: string;

  constructor({ name, code, purity, metal_type, description, company_id }) {
    this.name = name;
    this.code = code;
    this.purity = purity;
    this.metal_type = metal_type;
    this.description = description;
    this.company_id = company_id;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      purity: z.string().min(1).max(255),
      metal_type: z.number(),
      description: z.string().max(255).nullable().optional(),
      company_id: z.string().uuid(),
    });
  }
}
