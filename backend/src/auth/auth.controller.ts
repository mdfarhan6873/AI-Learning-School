import { Controller, Post, Body, Ip, Headers, HttpCode, HttpStatus, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, GoogleAuthDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(
        @Body() verifyOtpDto: VerifyOtpDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        return this.authService.verifyOtp(verifyOtpDto, ip, userAgent);
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    async googleAuth(
        @Body() googleAuthDto: GoogleAuthDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        return this.authService.verifyGoogleToken(googleAuthDto, ip, userAgent);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        return this.authService.refreshTokens(refreshTokenDto, ip, userAgent);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.logout(refreshTokenDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Req() req: Request) {
        return req.user;
    }
}
