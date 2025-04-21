import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/teams/:teamId/projects/:projectId/tasks',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Create a task',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
            projectId: z.string().cuid(),
          }),
          body: z.object({
            memberId: z.string().cuid(),
            description: z.string(),
            subTasks: z.array(z.string()).optional(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId, projectId } = request.params
        const { memberId, description, subTasks } = request.body

        await request.verifyUserIsTeamOwner(teamId)

        const task = await prisma.task.create({
          data: {
            description,
            memberId,
            projectId,
          },
        })

        if (subTasks && subTasks.length > 0) {
          const subTasksToPrisma = subTasks.map((item) => {
            return {
              description: item,
              taskId: task.id,
            }
          })

          await prisma.subTask.createMany({
            data: subTasksToPrisma,
          })
        }

        return reply.status(201).send()
      }
    )
}
