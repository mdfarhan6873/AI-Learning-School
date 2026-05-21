import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User, AuthProvider } from '../users/entities/user.entity';
import { AuthSession } from '../users/entities/auth-session.entity';
import { RedisService } from '../common/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, GoogleAuthDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { generateOtp, hashOtp } from './utils/otp.util';
import { normalizePhoneNumber } from './utils/phone.util';
import { OTP_EXPIRY_SECONDS, OTP_COOLDOWN_SECONDS, OTP_MAX_ATTEMPTS, OTP_ATTEMPT_LOCK_SECONDS } from './auth.constants';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
        private readonly usersService: UsersService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(AuthSession)
        private readonly sessionRepository: Repository<AuthSession>,
    ) {
        this.googleClient = new OAuth2Client(
            this.configService.get<string>('GOOGLE_CLIENT_ID')
        );
    }

    async sendOtp(sendOtpDto: SendOtpDto) {
        const { mobile, email } = sendOtpDto;
        
        if (!mobile && !email) {
            throw new BadRequestException('Either mobile or email must be provided');
        }

        let identifier = '';
        if (mobile) {
            identifier = normalizePhoneNumber(mobile);
        } else if (email) {
            identifier = email.toLowerCase();
        }

        const cooldownKey = `otp:cooldown:${identifier}`;
        const attemptsKey = `otp:verify_attempts:${identifier}`;
        const otpKey = `otp:${identifier}`;

        const cooldownExists = await this.redisService.client.get(cooldownKey);

        if (cooldownExists) {
            throw new HttpException('Please wait before requesting another OTP', HttpStatus.TOO_MANY_REQUESTS);
        }

        const attemptCount = Number(await this.redisService.client.get(attemptsKey)) || 0;

        if (attemptCount >= OTP_MAX_ATTEMPTS) {
            throw new HttpException('Too many OTP attempts. Try later.', HttpStatus.TOO_MANY_REQUESTS);
        }

        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);

        await this.redisService.client.set(otpKey, hashedOtp, { ex: OTP_EXPIRY_SECONDS });
        await this.redisService.client.set(cooldownKey, '1', { ex: OTP_COOLDOWN_SECONDS });
        // ====================================================================
        // 🚀 INTEGRATE REAL OTP PROVIDER HERE
        // ====================================================================
        // Replace the console.log below with your actual SMS/Email API call.
        //
        // Example for SMS (Twilio or MSG91):
        // if (mobile) {
        //     await this.twilioClient.messages.create({
        //         body: `Your login OTP is ${otp}. It expires in 5 minutes.`,
        //         to: identifier // This is the normalized E.164 phone number
        //     });
        // }
        //
        // Example for Email (SendGrid or Nodemailer):
        // if (email) {
        //     await this.emailService.sendEmail(
        //         identifier,
        //         'Your Login OTP',
        //         `Your login OTP is ${otp}. It expires in 5 minutes.`
        //     );
        // }
        // ====================================================================

        console.log(`[MOCK OTP PROVIDER] OTP for ${identifier}: ${otp}`);

        return { success: true, message: 'OTP sent successfully' };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto, ipAddress?: string, userAgent?: string) {
        const { mobile, email, otp, device_id, device_name } = verifyOtpDto;
        
        if (!mobile && !email) {
            throw new BadRequestException('Either mobile or email must be provided');
        }

        let identifier = '';
        if (mobile) {
            identifier = normalizePhoneNumber(mobile);
        } else if (email) {
            identifier = email.toLowerCase();
        }

        const attemptsKey = `otp:verify_attempts:${identifier}`;
        const redisKey = `otp:${identifier}`;
        
        const attemptCount = Number(await this.redisService.client.get(attemptsKey)) || 0;
        if (attemptCount >= OTP_MAX_ATTEMPTS) {
            throw new HttpException('Too many OTP verification attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
        }

        // Retrieve OTP from Redis
        const storedHashedOtp = await this.redisService.client.get<string>(redisKey);

        if (!storedHashedOtp || storedHashedOtp !== hashOtp(otp)) {
            await this.redisService.client.incr(attemptsKey);
            if (attemptCount === 0) {
                 await this.redisService.client.expire(attemptsKey, OTP_ATTEMPT_LOCK_SECONDS);
            }
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Delete OTP after successful verification
        await this.redisService.client.del(redisKey);
        
        // Also clear attempts and cooldown if any
        await this.redisService.client.del(`otp:cooldown:${identifier}`);
        await this.redisService.client.del(attemptsKey);

        // Check if user exists
        let user = mobile ? await this.usersService.findByMobile(identifier) : await this.usersService.findByEmail(identifier);

        if (!user) {
            user = await this.usersService.createStudentUser(identifier, !!email);
        } else {
            if (!user.is_active) {
                throw new UnauthorizedException('User account is disabled');
            }
            if (mobile && !user.mobile_verified) {
                user.mobile_verified = true;
                await this.userRepository.save(user);
            }
            if (email && !user.email_verified) {
                user.email_verified = true;
                await this.userRepository.save(user);
            }
        }

        await this.usersService.updateLastLogin(user.id);

        return this.generateTokensAndSession(user, device_id, device_name, ipAddress, userAgent);
    }

    async verifyGoogleToken(googleAuthDto: GoogleAuthDto, ipAddress?: string, userAgent?: string) {
        const { token, device_id, device_name } = googleAuthDto;

        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            });
            const payload = ticket.getPayload();

            if (!payload || !payload.email) {
                throw new BadRequestException('Invalid Google token payload');
            }

            const { email, name, sub: provider_user_id } = payload;

            let user = await this.userRepository.findOne({ where: { email } });

            if (!user) {
                // Register new user from Google using onboarding flow to ensure roles and profile
                user = await this.usersService.createStudentUser(email, true, {
                    full_name: name,
                    provider: 'google',
                    provider_user_id: provider_user_id,
                });
            } else {
                if (!user.is_active) {
                    throw new UnauthorizedException('User account is disabled');
                }
                // Ensure google provider is linked
                if (user.auth_provider !== 'google') {
                    // Update auth provider if they originally used something else, or keep both
                    // For now, if we allow multiple, we should just make sure provider_user_id is set
                    user.provider_user_id = provider_user_id;
                    user.email_verified = true;
                    await this.userRepository.save(user);
                }
            }

            user.last_login_at = new Date();
            await this.userRepository.save(user);

            return this.generateTokensAndSession(user, device_id, device_name, ipAddress, userAgent);

        } catch (error) {
            throw new UnauthorizedException('Invalid Google token');
        }
    }

    async refreshTokens(refreshTokenDto: RefreshTokenDto, ipAddress?: string, userAgent?: string) {
        const { refresh_token } = refreshTokenDto;

        try {
            // Verify refresh token signature and expiration
            const payload = this.jwtService.verify(refresh_token, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });

            const user_id = payload.sub;

            // Find an active session matching this user
            const sessions = await this.sessionRepository.find({
                where: { user_id, revoked_at: IsNull() },
            });

            let validSession: AuthSession | null = null;
            for (const session of sessions) {
                if (session.expires_at < new Date()) {
                    continue; // Session expired
                }
                const isMatch = await bcrypt.compare(refresh_token, session.refresh_token_hash);
                if (isMatch) {
                    validSession = session;
                    break;
                }
            }

            if (!validSession) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const user = await this.userRepository.findOne({ where: { id: user_id } });
            if (!user || !user.is_active) {
                throw new UnauthorizedException('User not found or disabled');
            }

            // Revoke old session and issue new one to rotate tokens (Refresh Token Rotation)
            validSession.revoked_at = new Date();
            await this.sessionRepository.save(validSession);

            return this.generateTokensAndSession(user, validSession.device_id || undefined, validSession.device_name || undefined, ipAddress, userAgent);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(refreshTokenDto: RefreshTokenDto) {
        const { refresh_token } = refreshTokenDto;

        try {
            const payload = this.jwtService.verify(refresh_token, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                ignoreExpiration: true, // Allow logging out even if slightly expired
            });

            const sessions = await this.sessionRepository.find({
                where: { user_id: payload.sub, revoked_at: IsNull() },
            });

            for (const session of sessions) {
                const isMatch = await bcrypt.compare(refresh_token, session.refresh_token_hash);
                if (isMatch) {
                    session.revoked_at = new Date();
                    await this.sessionRepository.save(session);
                    return { message: 'Logged out successfully' };
                }
            }

            return { message: 'Logged out successfully' };
        } catch (error) {
            // Even if token is completely invalid, we just return success
            return { message: 'Logged out successfully' };
        }
    }

    private async generateTokensAndSession(user: User, device_id?: string, device_name?: string, ipAddress?: string, userAgent?: string) {
        const payload = { sub: user.id, email: user.email, mobile: user.mobile, provider: user.auth_provider };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            expiresIn: (this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES')) as any,
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: (this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES')) as any,
        });

        // Hash the refresh token before saving to database
        const saltRounds = 10;
        const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);

        // Calculate expires_at based on config
        const expiresInStr = this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d';
        const days = parseInt(expiresInStr.replace('d', ''), 10) || 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // Single-device session enforcement
        await this.sessionRepository.update(
            { user_id: user.id },
            { revoked_at: new Date() }
        );

        const session = this.sessionRepository.create({
            user_id: user.id,
            refresh_token_hash: refreshTokenHash,
            device_id,
            device_name,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt,
        });

        await this.sessionRepository.save(session);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                mobile: user.mobile,
                email: user.email,
                full_name: user.full_name,
                is_profile_completed: user.is_profile_completed,
            }
        };
    }
}
