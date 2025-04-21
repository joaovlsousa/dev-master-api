import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getProjects(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get all team projects',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              projects: z.array(
                z.object({
                  id: z.string().cuid(),
                  name: z.string(),
                  description: z.string(),
                  createdAt: z.date(),
                })
              ),
            }),
          },
        },
      },
      async request => {
        const { teamId } = request.params

        const projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
          where: {
            ownerId: teamId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return { projects }
      }
    )
}
