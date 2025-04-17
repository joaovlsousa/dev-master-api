import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/teams/:teamId/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Create a project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId } = request.params
        const { name, description } = request.body

        await request.verifyUserIsTeamOwner(teamId)

        await prisma.project.create({
          data: {
            name,
            description,
            ownerId: teamId,
          },
        })

        return reply.status(201).send()
      }
    )
}
