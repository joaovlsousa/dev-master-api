import { prisma } from '@/lib/prisma'
import { updateProjectPercentage } from './update-project-percentage'

export async function updateTaskPercentage(taskId: string): Promise<void> {
  const subTasks = await prisma.subTask.findMany({
    select: {
      isDone: true,
    },
    where: {
      taskId,
    },
  })

  let completedTasks = 0

  for (const task of subTasks) {
    if (task.isDone) {
      completedTasks++
    }
  }

  const percentage = completedTasks / subTasks.length

  const { projectId } = await prisma.task.update({
    data: {
      percentage,
    },
    where: {
      id: taskId,
    },
    select: {
      projectId: true,
    },
  })

  await updateProjectPercentage(projectId)
}
