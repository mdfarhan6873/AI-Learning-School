import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BadRequestException } from '@nestjs/common';

export function normalizePhoneNumber(input: string): string {
    const phone = parsePhoneNumberFromString(input, 'IN'); // Defaulting to IN for context if + is missed, but parsePhoneNumberFromString handles international fine if + is present

    if (!phone || !phone.isValid()) {
        throw new BadRequestException('Invalid mobile number');
    }

    return phone.number; // E.164 format
}
