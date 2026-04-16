import { z } from 'zod';

export const AuthorizationSchema = z.object({
    baseUrl: z.url().nonempty(),
    merchantId: z.string().trim().nonempty(),
    serviceCode: z.string().trim().nonempty(),
    authenticationKey: z.object().and(
        z.object({}).loose().refine(obj => Object.keys(obj).length > 0)
    ),
    refreshToken: z.string().optional(),
    authToken: z.string().optional(),
    deviceId: z.string().optional(),
    serverPublic: z.object().optional(),
    tokenExpirationDateTime: z.union([z.string(), z.instanceof(Date)]).optional(),
});

export type AuthorizationDto = z.infer<typeof AuthorizationSchema>;
