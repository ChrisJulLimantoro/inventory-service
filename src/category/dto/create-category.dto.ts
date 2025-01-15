import { z } from 'zod';

export class CreateCategoryRequest {
  name: string;
  code: string;
  purity: string;
  metal_type: number;
  weight_tray: number;
  weight_paper: number;
  description: string | null;
  company_id: string;

  constructor({
    name,
    code,
    purity,
    metal_type,
    weight_tray,
    weight_paper,
    description,
    company_id,
  }) {
    this.name = name;
    this.code = code;
    this.purity = purity;
    this.metal_type = metal_type;
    this.weight_tray = weight_tray;
    this.weight_paper = weight_paper;
    this.description = description;
    this.company_id = company_id;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(5),
      purity: z.string().min(1).max(255),
      metal_type: z.number(),
      weight_tray: z.number().positive(),
      weight_paper: z.number().positive(),
      description: z.string().max(255).nullable().optional(),
      company_id: z.string().uuid(),
    });
  }
}
