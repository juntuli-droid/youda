"use client"

// import { apiRequest } from "./client/api"

type PersonalityReportInput = {
  code: string
  title: string
  description: string
  character: string
  frequencyLabel: string
  elapsedSeconds?: number
  violations?: number
  createdAt?: string
}

export function buildPersonalityReportText(input: PersonalityReportInput) {
  const createdAt = input.createdAt || new Date().toISOString()
  const elapsed = typeof input.elapsedSeconds === "number" ? `${input.elapsedSeconds}s` : "N/A"
  const violations = typeof input.violations === "number" ? String(input.violations) : "0"
  return [
    "有搭人格测评报告",
    `生成时间: ${createdAt}`,
    `人格编码: ${input.code}`,
    `人格标题: ${input.title}`,
    `人格角色: ${input.character}`,
    `活跃标签: ${input.frequencyLabel}`,
    `答题耗时: ${elapsed}`,
    `防作弊计数: ${violations}`,
    "",
    "结论摘要",
    input.description
  ].join("\n")
}

export function downloadPersonalityReportText(fileName: string, content: string) {
  if (typeof window === "undefined") return
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export async function exportPersonalityPdf(input: PersonalityReportInput) {
  // const payload = await apiRequest<{
  //   fileName: string
  //   mimeType: string
  //   contentBase64: string
  // }>("/api/personality/report/pdf", {
  //   method: "POST",
  //   body: JSON.stringify({
  //     code: input.code,
  //     title: input.title,
  //     description: input.description,
  //     character: input.character,
  //     frequencyLabel: input.frequencyLabel,
  //     elapsedSeconds: input.elapsedSeconds,
  //     violations: input.violations
  //   })
  // })
  // const blob = base64ToBlob(payload.contentBase64, payload.mimeType)
  // const url = URL.createObjectURL(blob)
  // const link = document.createElement("a")
  // link.href = url
  // link.download = payload.fileName
  // link.click()
  // URL.revokeObjectURL(url)
  return "about:blank";
}
