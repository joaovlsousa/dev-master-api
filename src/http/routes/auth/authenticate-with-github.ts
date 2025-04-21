import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { env } from '@/config/env'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function authenticateWithGithub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/github',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with GitHub',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body

      const githubOAuthURL = new URL(
        'https://github.com/login/oauth/access_token'
      )

      githubOAuthURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
      githubOAuthURL.searchParams.set(
        'client_secret',
        env.GITHUB_OAUTH_CLIENT_SECRET
      )
      githubOAuthURL.searchParams.set(
        'redirect_uri',
        env.GITHUB_OAUTH_CLIENT_REDIRECT_URI
      )
      githubOAuthURL.searchParams.set('code', code)

      const githubAccessTokenResponse = await fetch(githubOAuthURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const githubAccessTokenData = await githubAccessTokenResponse.json()

      const { access_token: githubAccessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
        })
        .parse(githubAccessTokenData)

      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
          Accept: 'application/json',
        },
      })

      const githubUserData = await githubUserResponse.json()

      let {
        name,
        avatar_url: avatarUrl,
        email,
      } = z
        .object({
          avatar_url: z.string().url(),
          name: z.string().nullable(),
          email: z.string().email().nullable(),
        })
        .parse(githubUserData)

      if (!email) {
        const githubUserEmailsResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
              Accept: 'application/json',
            },
          }
        )

        const githubUserEmailsData = await githubUserEmailsResponse.json()

        const githubUserEmails = z
          .array(
            z.object({
              email: z.string().email(),
              primary: z.boolean(),
            })
          )
          .parse(githubUserEmailsData)

        const githubUserEmail = githubUserEmails.find(
          (emails) => emails.primary
        )

        if (!githubUserEmail) {
          throw new BadRequestError(
            'Sua conta do GitHub deve ter um e-mail para autenticação.'
          )
        }

        email = githubUserEmail.email
      }

      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
          },
        })
      }

      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        }
      )

      return reply.status(201).send({ token })
    }
  )
}
