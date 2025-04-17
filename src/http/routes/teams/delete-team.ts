import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function deleteTeam(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/teams/:teamId',
      {
        schema: {
          tags: ['Teams'],
          summary: 'Delete a team',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId } = request.params

        await request.verifyUserIsTeamOwner(teamId)

        await prisma.team.delete({
          where: {
            id: teamId,
          },
        })

        return reply.status(204).send()
      }
    )
}
