import { IsBoolean, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";

export class CheckoutAddressDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  line2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  state!: string;

  @IsString()
  @Length(6, 6)
  pincode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;
}

export class CreateCheckoutDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  address?: CheckoutAddressDto;

  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;
}
