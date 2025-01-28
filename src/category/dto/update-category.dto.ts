import { z } from 'zod';

export class UpdateCategoryRequest {
  name: string | null;
  purity: string | null;
  metal_type: number | null;
  weight_tray: number | null;
  weight_paper: number | null;
  description: string | null;

  constructor({
    name,
    purity,
    metal_type,
    weight_tray,
    weight_paper,
    description,
  }) {
    this.name = name;
    this.purity = purity;
    this.metal_type = metal_type;
    this.weight_tray = parseFloat(weight_tray);
    this.weight_paper = parseFloat(weight_paper);
    this.description = description;
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255).nullable().optional(),
      purity: z.string().min(1).max(255).nullable().optional(),
      metal_type: z.number().nullable().optional(),
      weight_tray: z.number().positive().nullable().optional(),
      weight_paper: z.number().positive().nullable().optional(),
      description: z.string().max(255).nullable().optional(),
    });
  }
}
