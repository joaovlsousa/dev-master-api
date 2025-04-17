import { z } from 'zod'

const envSchema = z.object({
  JWT_SECRET: z.string(),
  PORT: z.coerce.number().default(3333),
  GITHUB_OAUTH_CLIENT_ID: z.string(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string(),
  GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string().url(),
})

export const env = envSchema.parse(process.env)
