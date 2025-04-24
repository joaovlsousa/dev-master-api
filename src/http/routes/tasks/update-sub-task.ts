import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { updateTaskPercentage } from '@/utils/update-task-percentage'
import { ForbiddenError } from '../_errors/forbidden-error'

export async function updateSubTask(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/teams/:teamId/projects/:projectId/tasks/:taskId/sub-tasks/:subTaskId',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Update a sub task',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
            subTaskId: z.string().cuid(),
          }),
          body: z.object({
            isDone: z.boolean(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { taskId, subTaskId } = request.params
        const { isDone } = request.body

        const userId = await request.getCurrentUserId()

        const task = await prisma.task.findUnique({
          select: {
            memberId: true,
          },
          where: {
            id: taskId,
          },
        })

        if (!task || userId !== task.memberId) {
          throw new ForbiddenError('Você não pode fazer essa ação')
        }

        await prisma.subTask.update({
          data: {
            isDone,
          },
          where: {
            id: subTaskId,
          },
        })

        await updateTaskPercentage(taskId)

        return reply.status(204).send()
      }
    )
}
