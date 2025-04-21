import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getTeams(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams',
      {
        schema: {
          tags: ['Teams'],
          summary: 'Get teams',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              teams: z.array(
                z.object({
                  id: z.string().cuid(),
                  name: z.string(),
                  isOwner: z.boolean(),
                })
              ),
            }),
          },
        },
      },
      async (request) => {
        const userId = await request.getCurrentUserId()

        const teamsWithOwnerId = await prisma.team.findMany({
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        })

        const teams = teamsWithOwnerId.map((team) => {
          return {
            id: team.id,
            name: team.name,
            isOwner: team.ownerId === userId,
          }
        })

        return { teams }
      }
    )
}
