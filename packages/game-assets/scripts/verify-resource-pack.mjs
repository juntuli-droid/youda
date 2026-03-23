import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { access } from "node:fs/promises"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function readJson(relPath) {
  const abs = path.join(root, relPath)
  const raw = await readFile(abs, "utf8")
  return JSON.parse(raw)
}

async function main() {
  const avatars = await readJson("avatars/manifest.json")
  const badges = await readJson("badges/manifest.json")
  const version = await readJson("VERSION.json")

  if (avatars.total !== 27) {
    throw new Error(`avatars.total=${avatars.total}，预期为27`)
  }

  for (const item of avatars.items) {
    const displayOk = await exists(path.join(root, item.display.file))
    const avatarOk = await exists(path.join(root, item.avatar.file))
    if (!displayOk || !avatarOk) {
      throw new Error(`角色资源缺失: ${item.id} ${item.character}`)
    }
  }

  for (const item of badges.items) {
    const activeOk = await exists(path.join(root, item.active.file))
    const inactiveOk = await exists(path.join(root, item.inactive.file))
    if (!activeOk || !inactiveOk) {
      throw new Error(`徽章资源缺失: ${item.id} ${item.name}`)
    }
  }

  console.log("resource-pack verify passed")
  console.log(`version=${version.resourcePackVersion}`)
  console.log(`avatars=${avatars.total}`)
  console.log(`badges=${badges.total}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
