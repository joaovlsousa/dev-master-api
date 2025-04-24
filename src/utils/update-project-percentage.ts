import { prisma } from '@/lib/prisma'

export async function updateProjectPercentage(
  projectId: string
): Promise<void> {
  const tasks = await prisma.task.findMany({
    select: {
      percentage: true,
    },
    where: {
      projectId,
    },
  })

  let tasksPercentage = 0

  for (const task of tasks) {
    tasksPercentage += task.percentage
  }

  const percentage = tasksPercentage / tasks.length

  await prisma.project.update({
    data: {
      percentage,
    },
    where: {
      id: projectId,
    },
  })
}
