import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { updateTaskPercentage } from '@/utils/update-task-percentage'

export async function deleteSubTask(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/teams/:teamId/projects/:projectId/tasks/:taskId/sub-tasks/:subTaskId',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Delete a sub task',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
            subTaskId: z.string().cuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, taskId, subTaskId } = request.params

        await request.verifyUserIsTeamOwner(teamId)

        await prisma.subTask.delete({
          where: {
            id: subTaskId,
          },
        })

        await updateTaskPercentage(taskId)

        return reply.status(204).send()
      }
    )
}
