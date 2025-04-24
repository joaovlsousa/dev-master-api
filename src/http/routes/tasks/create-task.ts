import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { updateProjectPercentage } from '@/utils/update-project-percentage'

export async function createTask(app: FastifyInstance) {
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

        const isTeamMember = await prisma.member.findUnique({
          where: {
            teamId_userId: {
              teamId,
              userId: memberId,
            },
          },
        })

        if (!isTeamMember) {
          throw new BadRequestError('Este usuário não faz parte do time')
        }

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

        await updateProjectPercentage(projectId)

        return reply.status(201).send()
      }
    )
}
