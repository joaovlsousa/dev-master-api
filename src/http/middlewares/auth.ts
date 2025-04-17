import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

import { NotFoundError } from '@/http/routes/_errors/not-found-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async request => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Token inválido')
      }
    }

    request.verifyUserIsTeamOwner = async (teamId: string) => {
      const userId = await request.getCurrentUserId()

      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      })

      if (!team) {
        throw new NotFoundError('Equipe não encontrada')
      }

      if (team.ownerId !== userId) {
        throw new UnauthorizedError(
          'Você não tem permissão para realizar essa ação'
        )
      }
    }
  })
})
