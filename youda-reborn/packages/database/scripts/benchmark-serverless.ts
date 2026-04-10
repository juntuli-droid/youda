import { benchmarkDatabaseColdStart, prisma } from '../index'

async function main() {
  const benchmark = await benchmarkDatabaseColdStart()
  console.info(
    JSON.stringify(
      {
        event: 'database.cold-start.benchmark',
        targetMs: 1500,
        ...benchmark
      },
      null,
      2
    )
  )

  if (benchmark.coldStartMs > 1500) {
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
