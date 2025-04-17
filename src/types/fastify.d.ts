import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    verifyUserIsTeamOwner(teamId: string): Promise<void>
  }
}
