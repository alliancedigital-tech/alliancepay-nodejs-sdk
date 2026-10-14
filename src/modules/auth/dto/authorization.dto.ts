import { z } from 'zod';

export const AuthorizationSchema = z.object({
    baseUrl: z.url().nonempty(),
    merchantId: z.string().trim().nonempty(),
    jwsPrivateKey: z.string().trim().nonempty(),
    jwsKeyId: z.string().trim().nonempty(),
});

export type AuthorizationDto = z.infer<typeof AuthorizationSchema>;
