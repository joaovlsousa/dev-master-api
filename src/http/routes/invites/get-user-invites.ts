import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getUserInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get user invites',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string().cuid(),
                  authorName: z.string().nullable(),
                  teamName: z.string(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new UnauthorizedError('Você não pode fazer essa ação')
        }

        const prismaInvites = await prisma.invite.findMany({
          select: {
            id: true,
            author: {
              select: {
                name: true,
              },
            },
            team: {
              select: {
                name: true,
              },
            },
          },
          where: {
            guestEmail: user.email,
          },
        })

        const invites = prismaInvites.map((invite) => {
          return {
            id: invite.id,
            authorName: invite.author.name,
            teamName: invite.team.name,
          }
        })

        return reply.status(200).send({ invites })
      }
    )
}
