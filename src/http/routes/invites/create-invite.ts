import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/teams/:teamId/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Create a invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
          }),
          body: z.object({
            guestEmail: z.string().email(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { teamId } = request.params
        const { guestEmail } = request.body

        await request.verifyUserIsTeamOwner(teamId)
        const userId = await request.getCurrentUserId()

        const guestUser = await prisma.user.findUnique({
          where: {
            email: guestEmail,
          },
        })

        if (!guestUser) {
          throw new BadRequestError('Este usuário não possui conta no sistema')
        }

        const userIsTeamMember = await prisma.member.findUnique({
          where: {
            teamId_userId: {
              teamId,
              userId: guestUser.id,
            },
          },
        })

        if (userIsTeamMember) {
          throw new BadRequestError('Este usuário já é membro do time')
        }

        const userIsInvited = await prisma.invite.findUnique({
          where: {
            guestEmail_teamId: {
              teamId,
              guestEmail,
            },
          },
        })

        if (userIsInvited) {
          throw new BadRequestError('Este usuário já foi convidado')
        }

        await prisma.invite.create({
          data: {
            guestEmail,
            authorId: userId,
            teamId,
          },
        })

        return reply.status(201).send()
      }
    )
}
