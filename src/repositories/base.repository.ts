import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';

@Injectable()
export class BaseRepository<T> {
  constructor(
    protected prisma: PrismaService,
    private modelName: string,
    protected relations: Record<string, any>,
    protected isSoftDelete = false,
  ) {}

  // Create a new record with possible relations
  async create(data: any, user_id?: string): Promise<T> {
    const created = await this.prisma[this.modelName].create({
      data,
      include: this.relations,
    });
    await this.actionLog(this.modelName, created.id, 'CREATE', null, user_id);
    return created;
  }

  // Get all records with possible relations and filter criteria
  async findAll(
    filter?: Record<string, any>,
    page?: number,
    limit?: number,
    sort?: Record<string, 'asc' | 'desc'>,
    search?: string,
  ): Promise<{
    data: any[];
    total?: number;
    page?: number;
    totalPages?: number;
  }> {
    const fields = (await this.getModelFields()).filter(
      (field) =>
        !field.name.includes('id') &&
        !field.name.includes('_by') &&
        !field.name.includes('_link'),
    );
    const stringFields = fields.filter(
      (field) => field.type.toLowerCase() === 'string',
    );

    const searchConditions = search
      ? {
          OR: stringFields.map((field) => ({
            [field.name]: {
              contains: search,
              mode: 'insensitive',
            },
          })),
        }
      : {};

    // Prepare dynamic date filter (assumes the column is named 'date')
    let dateFilter = {};
    if (filter?.date?.start || filter?.date?.end) {
      const dateField = filter.date.field || 'date';
      const startDate = filter.date.start
        ? new Date(filter.date.start)
        : new Date(0);
      const endDate = filter.date.end ? new Date(filter.date.end) : new Date();
      endDate.setHours(23, 59, 59, 999);
      dateFilter = {
        [dateField]: {
          gte: startDate,
          lte: endDate,
        },
      };
      // Remove the `date` key from filter so it doesn't get included again below
    }
    delete filter.date;

    // Ensure correct WHERE structure: deleted_at IS NULL AND (OR conditions)
    const whereConditions = {
      AND: {
        ...(this.isSoftDelete
          ? { deleted_at: null }
          : { NOT: { deleted_at: null } }),
        ...searchConditions,
        ...filter,
        ...dateFilter,
      },
    };

    // Apply sorting
    const orderBy = sort
      ? Object.entries(sort).map(([key, value]) => ({
          [key]: value,
        }))
      : undefined;

    // If page & limit are not provided, return all records (no pagination)
    if (!page || !limit || page === 0 || limit === 0) {
      const data = await this.prisma[this.modelName].findMany({
        where: whereConditions,
        include: this.relations,
      });
      return { data }; // No pagination metadata
    }

    // Get total count before applying pagination
    const total = await this.prisma[this.modelName].count({
      where: whereConditions,
    });

    // Fetch paginated records
    const data = await this.prisma[this.modelName].findMany({
      where: whereConditions,
      include: this.relations,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderBy,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Find a record by ID with possible relations and filter criteria
  async findOne(id: string, filter?: Record<string, any>): Promise<T | null> {
    const whereConditions: Record<string, any> = {
      ...(this.isSoftDelete ? { id, deleted_at: null } : { id }),
      ...filter, // Add the provided filter conditions
    };

    return this.prisma[this.modelName].findUnique({
      where: whereConditions, // Apply dynamic filter along with soft delete condition
      include: this.relations,
    });
  }

  // Update a record with possible relations
  async update(id: string, data: any, user_id?: string): Promise<T> {
    const before = await this.prisma[this.modelName].findFirst({
      where: this.isSoftDelete ? { id, deleted_at: null } : { id },
    });
    data.updated_at = new Date();
    const updated = await this.prisma[this.modelName].update({
      where: this.isSoftDelete ? { id, deleted_at: null } : { id },
      data,
      include: this.relations,
    });
    const diff = this.getDiff(before, updated);
    await this.actionLog(this.modelName, id, 'UPDATE', diff, user_id);
    return updated;
  }

  // Delete a record by ID
  async delete(id: string, user_id?: string): Promise<T> {
    await this.actionLog(this.modelName, id, 'DELETE', null, user_id);
    if (this.isSoftDelete) {
      return this.prisma[this.modelName].update({
        where: { id },
        data: { deleted_at: new Date(), updated_at: new Date() },
      });
    }
    return this.prisma[this.modelName].delete({
      where: { id },
      include: this.relations,
    });
  }

  async deleteWhere(
    filter: Record<string, any>,
    user_id?: string,
  ): Promise<number> {
    if (filter.length === 0) {
      throw new RpcException('Filter cannot be empty');
    }

    if (this.isSoftDelete) {
      filter.deleted_at = null;
      const updated = await this.prisma[this.modelName].updateManyAndReturn({
        where: filter,
        data: { deleted_at: new Date(), updated_at: new Date() },
      });
      for (const item of updated) {
        this.actionLog(this.modelName, item.id, 'DELETE', null, user_id);
      }
      return updated;
    }
    const deleted = await this.prisma[this.modelName].deleteManyAndReturn({
      where: filter,
    });
    for (const item of deleted) {
      this.actionLog(this.modelName, item.id, 'DELETE', null, user_id);
    }
    return deleted;
  }

  // Restore a soft deleted record
  async restore(id: string, user_id?: string): Promise<T> {
    await this.actionLog(this.modelName, id, 'RESTORE', null, user_id);
    return this.prisma[this.modelName].update({
      where: { id },
      data: { deleted_at: null, updated_at: new Date() },
    });
  }

  // function for count
  async count(filter?: Record<string, any>): Promise<number> {
    return this.prisma[this.modelName].count({
      where: filter,
    });
  }

  async getModelFields(): Promise<Record<string, string>[]> {
    const model = Prisma.dmmf.datamodel.models.find(
      (m) => m.name.toLowerCase() === this.modelName.toLowerCase(),
    );
    if (!model) throw new RpcException(`Model ${this.modelName} not found`);

    return model.fields.map((field) => ({
      name: field.name,
      type: field.isList ? `${field.type}[]` : field.type,
    }));
  }

  async sync(data: any[]) {
    const datas = await Promise.all(
      data.map((d) =>
        this.prisma[this.modelName].upsert({
          where: { id: d.id },
          update: d,
          create: d,
        }),
      ),
    );
    return datas;
  }

  // Add logging
  getDiff(
    before: Record<string, any>,
    after: Record<string, any>,
    excludeKeys: string[] = ['id', 'updatedAt'],
  ) {
    const diff: Record<string, { from: any; to: any }> = {};
    for (const key in after) {
      if (excludeKeys.includes(key)) continue;
      if (before[key] !== after[key]) {
        diff[key] = { from: before[key], to: after[key] };
      }
    }
    return diff;
  }

  async actionLog(
    resource: string,
    resource_id: string,
    event: string,
    diff: any,
    user_id: string,
  ) {
    const log = {
      resource,
      resource_id,
      event,
      diff: JSON.stringify(diff),
      user_id,
    };

    return this.prisma.actionLog.create({
      data: log,
    });
  }
}
