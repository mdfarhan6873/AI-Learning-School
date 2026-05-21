import { IsString, IsNotEmpty, IsOptional, Length, IsEmail } from 'class-validator';

export class SendOtpDto {
    @IsString()
    @IsOptional()
    mobile?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}

export class VerifyOtpDto {
    @IsString()
    @IsOptional()
    mobile?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    otp: string;

    @IsString()
    @IsOptional()
    device_id?: string;

    @IsString()
    @IsOptional()
    device_name?: string;
}

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refresh_token: string;
}

export class GoogleAuthDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsOptional()
    device_id?: string;

    @IsString()
    @IsOptional()
    device_name?: string;
}
