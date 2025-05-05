import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function acceptInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/invites/:inviteId/accept',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Accept a invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            inviteId: z.string().cuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { inviteId } = request.params

        const userId = await request.getCurrentUserId()

        const { teamId } = await prisma.invite.update({
          where: {
            id: inviteId,
          },
          data: {
            status: 'ACCEPT',
          },
        })

        await prisma.member.create({
          data: {
            teamId,
            userId,
          },
        })

        return reply.status(204).send()
      }
    )
}
