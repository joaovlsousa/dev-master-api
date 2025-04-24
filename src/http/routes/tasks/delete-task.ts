import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function deleteTask(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/teams/:teamId/projects/:projectId/tasks/:taskId',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Delete a task',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, taskId } = request.params

        await request.verifyUserIsTeamOwner(teamId)

        await prisma.task.delete({
          where: {
            id: taskId,
          },
        })

        return reply.status(204).send()
      }
    )
}
