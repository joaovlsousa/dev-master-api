import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getUserIsTeamOwner(teamId: string): Promise<boolean>
  }
}
