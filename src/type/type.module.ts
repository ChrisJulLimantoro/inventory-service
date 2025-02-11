import { Module } from '@nestjs/common';
import { TypeController } from './type.controller';
import { TypeService } from './type.service';
import { TypeRepository } from 'src/repositories/type.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedModule } from 'src/shared.module';
import { CategoryRepository } from 'src/repositories/category.repository';

@Module({
  imports: [SharedModule],
  controllers: [TypeController],
  providers: [TypeService, TypeRepository, CategoryRepository, PrismaService],
})
export class TypeModule {}
