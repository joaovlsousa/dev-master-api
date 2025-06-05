import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function createTeam(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/teams',
      {
        schema: {
          tags: ['Teams'],
          summary: 'Create a team',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
          }),
          response: {
            201: z.object({
              teamId: z.string().cuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { name } = request.body

        const team = await prisma.team.create({
          data: {
            name,
            ownerId: userId,
          },
          select: {
            id: true,
          },
        })

        await prisma.member.create({
          data: {
            role: 'OWNER',
            teamId: team.id,
            userId,
          },
        })

        return reply.status(201).send({ teamId: team.id })
      }
    )
}
