import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { $Enums as PrismaEnums } from 'generated/prisma'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getTeamInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/teams/:teamId/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get team invites',
          security: [{ bearerAuth: [] }],
          params: z.object({
            teamId: z.string().cuid(),
          }),
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string().cuid(),
                  guestEmail: z.string().email(),
                  status: z.nativeEnum(PrismaEnums.InviteStatus),
                  createdAt: z.date(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { teamId } = request.params
        await request.verifyUserIsTeamOwner(teamId)

        const invites = await prisma.invite.findMany({
          select: {
            id: true,
            guestEmail: true,
            status: true,
            createdAt: true,
          },
          where: {
            teamId,
          },
        })

        return reply.status(200).send({ invites })
      }
    )
}
