import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { NotFoundError } from '@/http/routes/_errors/not-found-error'
import { prisma } from '@/lib/prisma'

export async function getTeam(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId',
      {
        schema: {
          tags: ['Teams'],
          summary: 'Get teams',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              team: z.object({
                id: z.string().cuid(),
                name: z.string(),
                createdAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request) => {
        const { teamId } = request.params

        const team = await prisma.team.findUnique({
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          where: {
            id: teamId,
          },
        })

        if (!team) {
          throw new NotFoundError('Time não encontrado')
        }

        return { team }
      }
    )
}
