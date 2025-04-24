import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getSubTasks(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId/projects/:projectId/tasks/:taskId/sub-tasks',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Get all project sub-tasks',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              tasks: z.array(
                z.object({
                  id: z.string().cuid(),
                  description: z.string(),
                  isDone: z.boolean(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { taskId } = request.params

        const tasks = await prisma.subTask.findMany({
          select: {
            id: true,
            description: true,
            isDone: true,
          },
          where: {
            taskId,
          },
          orderBy: {
            isDone: 'desc',
          },
        })

        return reply.send({ tasks })
      }
    )
}
