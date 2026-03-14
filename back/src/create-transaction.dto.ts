import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  asset: string;

  // On transforme automatiquement ce qu'on reçoit en Nombre
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
