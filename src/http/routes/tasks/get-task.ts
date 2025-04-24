import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '../_errors/not-found-error'

export async function getTask(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId/projects/:projectId/tasks/:taskId',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Get task details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
            taskId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              task: z.object({
                description: z.string(),
                percentage: z.number().min(0).max(1),
                createdAt: z.date(),
                member: z
                  .object({
                    name: z.string().nullable(),
                    avatarUrl: z.string().url(),
                  })
                  .nullable(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { projectId, taskId } = request.params

        const tasksWithMember = await prisma.task.findUnique({
          where: {
            id: taskId,
            projectId,
          },
          include: {
            member: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        })

        if (!tasksWithMember) {
          throw new NotFoundError('Tarefa não encontrada')
        }

        const task = {
          id: tasksWithMember.id,
          description: tasksWithMember.description,
          percentage: tasksWithMember.percentage,
          createdAt: tasksWithMember.createdAt,
          member: tasksWithMember.member,
        }

        return reply.send({ task })
      }
    )
}
