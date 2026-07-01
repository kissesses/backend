import { z } from 'zod'

export const httpsUrlSchema = z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
        message: 'URL must use https:',
    })

export const optionalHttpsUrlSchema = z
    .string()
    .refine((value) => value === '' || value.startsWith('https://'), {
        message: 'URL must use https:',
    })
