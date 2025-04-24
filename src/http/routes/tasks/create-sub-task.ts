import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { updateTaskPercentage } from '@/utils/update-task-percentage'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createSubTask(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/teams/:teamId/projects/:projectId/tasks/:taskId/sub-tasks',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Create a sub task',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
          }),
          body: z.object({
            subTasks: z.array(z.string()),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, taskId } = request.params
        const { subTasks } = request.body

        await request.verifyUserIsTeamOwner(teamId)

        if (subTasks.length === 0) {
          throw new BadRequestError('Informe pelo menos uma sub tarefa')
        }

        const subTasksToPrisma = subTasks.map((item) => {
          return {
            description: item,
            taskId,
          }
        })

        await prisma.subTask.createMany({
          data: subTasksToPrisma,
        })

        await updateTaskPercentage(taskId)

        return reply.status(201).send()
      }
    )
}
