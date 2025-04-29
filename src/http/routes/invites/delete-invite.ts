import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function deleteInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/teams/:teamId/invites/:inviteId',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Delete a invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            inviteId: z.string().cuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, inviteId } = request.params

        await request.verifyUserIsTeamOwner(teamId)

        await prisma.invite.delete({
          where: {
            id: inviteId,
          },
        })

        return reply.status(204).send()
      }
    )
}
