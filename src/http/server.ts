import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { env } from '@/config/env'

import { errorHandler } from './error-handler'
import { authenticateWithGithub } from './routes/auth/authenticate-with-github'
import { getProfile } from './routes/auth/get-profile'
import { createInvite } from './routes/invites/create-invite'
import { deleteInvite } from './routes/invites/delete-invite'
import { createProject } from './routes/projects/create-project'
import { getProject } from './routes/projects/get-project'
import { getProjects } from './routes/projects/get-projects'
import { updateProject } from './routes/projects/update-project'
import { createSubTask } from './routes/tasks/create-sub-task'
import { createTask } from './routes/tasks/create-task'
import { deleteSubTask } from './routes/tasks/delete-sub-task'
import { deleteTask } from './routes/tasks/delete-task'
import { getSubTasks } from './routes/tasks/get-sub-tasks'
import { getTask } from './routes/tasks/get-task'
import { getTasks } from './routes/tasks/get-tasks'
import { updateSubTask } from './routes/tasks/update-sub-task'
import { updateTask } from './routes/tasks/update-task'
import { createTeam } from './routes/teams/create-team'
import { deleteTeam } from './routes/teams/delete-team'
import { getTeams } from './routes/teams/get-teams'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Stack Flow API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors)

app.register(authenticateWithGithub)
app.register(getProfile)

app.register(createTeam)
app.register(getTeams)
app.register(deleteTeam)

app.register(createProject)
app.register(getProjects)
app.register(getProject)
app.register(updateProject)

app.register(createTask)
app.register(updateTask)
app.register(getTasks)
app.register(getTask)
app.register(deleteTask)

app.register(createSubTask)
app.register(getSubTasks)
app.register(updateSubTask)
app.register(deleteSubTask)

app.register(createInvite)
app.register(deleteInvite)

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running!')
})
