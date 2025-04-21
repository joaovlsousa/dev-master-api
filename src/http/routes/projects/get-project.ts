import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '../_errors/not-found-error'

export async function getProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId/projects/:projectId',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get project details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              project: z.object({
                id: z.string().cuid(),
                name: z.string(),
                description: z.string(),
                createdAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request) => {
        const { teamId, projectId } = request.params

        const project = await prisma.project.findUnique({
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
          where: {
            id: projectId,
            ownerId: teamId,
          },
        })

        if (!project) {
          throw new NotFoundError('Projeto não encontrado')
        }

        return { project }
      }
    )
}
