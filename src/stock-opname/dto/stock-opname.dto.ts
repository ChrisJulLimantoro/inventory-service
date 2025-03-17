import { z } from 'zod';
import { StockOpnameDetailDTO } from './stock-opname-detail.dto';

export class StockOpnameDTO {
  id: string;
  store_id: string;
  category_id: string;
  date: Date;
  status: number;
  description?: string;
  approve: boolean;
  approve_by?: string;
  approve_at?: Date;

  store?: any | null;
  category?: any | null;
  details?: StockOpnameDetailDTO[];

  created_by?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;

  constructor({
    id,
    store_id,
    category_id,
    date,
    status,
    description,
    approve,
    approve_by,
    approve_at,
    store,
    category,
    details,
    created_by,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.store_id = store_id;
    this.category_id = category_id;
    this.date = new Date(date);
    this.status = status;
    this.description = description;
    this.approve = approve;
    this.approve_by = approve_by;
    this.approve_at = approve_at ? new Date(approve_at) : undefined;

    this.store = store;
    this.category = category;
    this.details = details || [];

    this.created_by = created_by;
    this.created_at = new Date(created_at);
    this.updated_at = new Date(updated_at);
    this.deleted_at = deleted_at ? new Date(deleted_at) : null;
  }

  static baseSchema = {
    store_id: z.string().uuid(),
    category_id: z.string().uuid(),
    date: z.date(),
    status: z.number().int(),
    description: z.string().optional().nullable(),
    created_by: z.string().uuid().optional().nullable(),
  };

  static restrictedFields = [
    'id',
    'store_id',
    'category_id',
    'updated_at',
    'deleted_at',
    'created_at',
  ];

  static createSchema() {
    return z.object(this.baseSchema);
  }

  static updateSchema() {
    return z.object(
      Object.fromEntries(
        Object.entries(this.baseSchema)
          .filter(([key]) => !this.restrictedFields.includes(key))
          .map(([key, schema]) => [key, schema.nullable().optional()]),
      ),
    );
  }

  static fromPrisma(raw: any): StockOpnameDTO {
    return new StockOpnameDTO({
      ...raw,

      details: raw.details
        ? StockOpnameDetailDTO.fromPrismaArray(raw.details)
        : [],
      created_at: new Date(raw.created_at),
      updated_at: new Date(raw.updated_at),
      deleted_at: raw.deleted_at ? new Date(raw.deleted_at) : null,
    });
  }

  static fromPrismaArray(rawArray: any[]): StockOpnameDTO[] {
    return rawArray.map((raw) => StockOpnameDTO.fromPrisma(raw));
  }
}
