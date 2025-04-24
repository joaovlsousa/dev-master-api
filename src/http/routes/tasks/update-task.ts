import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function updateTask(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/teams/:teamId/projects/:projectId/tasks/:taskId',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Update a task',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
          }),
          body: z.object({
            memberId: z.string().cuid(),
            description: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, projectId, taskId } = request.params
        const { memberId, description } = request.body

        await request.verifyUserIsTeamOwner(teamId)

        await prisma.task.update({
          data: {
            description,
            memberId,
          },
          where: {
            id: taskId,
            projectId,
          },
        })

        return reply.status(204).send()
      }
    )
}
