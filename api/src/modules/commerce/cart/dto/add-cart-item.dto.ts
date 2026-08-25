import { IsInt, IsString, Max, Min, MinLength } from "class-validator";

export class AddCartItemDto {
  @IsString()
  @MinLength(6)
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  qty!: number;
}
