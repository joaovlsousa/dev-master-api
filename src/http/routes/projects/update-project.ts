import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '../_errors/not-found-error'

export async function updateProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/teams/:teamId/projects/:projectId',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Update a project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, projectId } = request.params
        const { name, description } = request.body

        await request.verifyUserIsTeamOwner(teamId)

        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
          },
        })

        if (!project) {
          throw new NotFoundError('Projeto não encontrado')
        }

        await prisma.project.update({
          where: {
            id: projectId,
          },
          data: {
            name,
            description,
          },
        })

        return reply.status(204).send()
      }
    )
}
