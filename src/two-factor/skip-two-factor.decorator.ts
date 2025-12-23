import { SetMetadata } from '@nestjs/common';

export const SkipTwoFactor = () => SetMetadata('skipTwoFactor', true);