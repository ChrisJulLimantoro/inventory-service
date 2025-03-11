import { z } from 'zod';

export class StockOpnameDetailDTO {
  id: string;
  stock_opname_id: string;
  product_code_id: string;
  description?: string;
  scanned: boolean;

  productCode?: any | null;

  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;

  constructor({
    id,
    stock_opname_id,
    product_code_id,
    description,
    scanned,
    productCode,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.stock_opname_id = stock_opname_id;
    this.product_code_id = product_code_id;
    this.description = description;
    this.scanned = scanned;

    this.productCode = productCode || null;
    this.created_at = new Date(created_at);
    this.updated_at = new Date(updated_at);
    this.deleted_at = deleted_at ? new Date(deleted_at) : null;
  }

  static baseSchema = {
    stock_opname_id: z.string().uuid(),
    product_code_id: z.string().uuid(),
    description: z.string().optional(),
    scanned: z.boolean(),
  };

  static restrictedFields = ['id', 'stock_opname_id', 'product_code_id'];

  static createSchema() {
    return z.object(this.baseSchema);
  }

  static updateSchema() {
    return z.object(
      Object.fromEntries(
        Object.entries(this.baseSchema).map(([key, schema]) => [
          key,
          this.restrictedFields.includes(key)
            ? z.never()
            : schema.nullable().optional(),
        ]),
      ),
    );
  }

  static fromPrisma(raw: any): StockOpnameDetailDTO {
    return new StockOpnameDetailDTO({
      ...raw,
      created_at: new Date(raw.created_at),
      updated_at: new Date(raw.updated_at),
      deleted_at: raw.deleted_at ? new Date(raw.deleted_at) : null,
    });
  }

  static fromPrismaArray(rawArray: any[]): StockOpnameDetailDTO[] {
    return rawArray.map((raw) => StockOpnameDetailDTO.fromPrisma(raw));
  }
}
