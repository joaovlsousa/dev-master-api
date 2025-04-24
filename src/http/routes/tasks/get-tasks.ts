import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getTasks(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId/projects/:projectId/tasks',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Get all project tasks',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              tasks: z.array(
                z.object({
                  id: z.string().cuid(),
                  description: z.string(),
                  percentage: z.number().min(0).max(1),
                  createdAt: z.date(),
                  member: z
                    .object({
                      name: z.string().nullable(),
                      avatarUrl: z.string().url(),
                    })
                    .nullable(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { projectId } = request.params

        const tasksWithMember = await prisma.task.findMany({
          where: {
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

        const tasks = tasksWithMember.map((task) => {
          return {
            id: task.id,
            description: task.description,
            percentage: task.percentage,
            createdAt: task.createdAt,
            member: task.member,
          }
        })

        return reply.send({ tasks })
      }
    )
}
