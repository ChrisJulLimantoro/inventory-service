import { z } from 'zod';

export class CreateTypeRequest {
  name: string;
  code: string;
  description: string | null;
  category_id: string;
  percent_price_reduction: number;
  fixed_price_reduction: number;
  percent_broken_reduction: number;
  fixed_broken_reduction: number;

  constructor({
    name,
    code,
    description,
    category_id,
    percent_price_reduction,
    fixed_price_reduction,
    percent_broken_reduction,
    fixed_broken_reduction,
  }: CreateTypeRequest) {
    this.name = name;
    this.code = code;
    this.description = description;
    this.category_id = category_id;
    this.percent_price_reduction = Number(percent_price_reduction);
    this.fixed_price_reduction = Number(fixed_price_reduction);
    this.percent_broken_reduction = Number(percent_broken_reduction);
    this.fixed_broken_reduction = Number(fixed_broken_reduction);
  }

  static schema() {
    return z.object({
      name: z.string().min(3).max(255),
      code: z.string().max(15),
      description: z.string().max(255).nullable().optional(),
      category_id: z.string().uuid(),
      percent_price_reduction: z.number().min(0).max(100),
      fixed_price_reduction: z.number().min(0),
      percent_broken_reduction: z.number().min(0).max(100),
      fixed_broken_reduction: z.number().min(0),
    });
  }
}
