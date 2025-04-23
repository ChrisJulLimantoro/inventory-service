import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from 'src/repositories/category.repository';
import { SharedModule } from 'src/shared.module';
import { CompanyRepository } from 'src/repositories/company.repository';

@Module({
  imports: [SharedModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, CompanyRepository],
})
export class CategoryModule {}
