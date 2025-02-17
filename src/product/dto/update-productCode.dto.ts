import { z } from 'zod';
export class UpdateProductCodeDto {
  status?: number | null;
  weight?: number | null;
  fixed_price?: number | null;

  constructor({ status, weight, fixed_price }) {
    this.status = parseInt(status);
    this.weight = weight ? parseFloat(weight) : undefined;
    this.fixed_price = fixed_price ? parseFloat(fixed_price) : undefined;
  }

  static schema() {
    return z.object({
      status: z.number().nullable().optional(),
      weight: z.number().nullable().optional(),
      fixed_price: z.number().nullable().optional(),
    });
  }
}
