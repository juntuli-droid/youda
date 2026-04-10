import sgMail from '@sendgrid/mail'
import { env } from '@/lib/env'

const sendgridEnabled = !env.SENDGRID_API_KEY.startsWith('dev-')

const passwordResetTemplateId = process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID
const suspiciousLoginTemplateId = process.env.SENDGRID_SUSPICIOUS_LOGIN_TEMPLATE_ID
const loginChallengeTemplateId = process.env.SENDGRID_LOGIN_CHALLENGE_TEMPLATE_ID

if (sendgridEnabled) {
  sgMail.setApiKey(env.SENDGRID_API_KEY)
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!sendgridEnabled) {
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'mailer.password-reset.skipped',
        email,
        resetUrl
      })
    )
    return
  }

  if (passwordResetTemplateId) {
    await sgMail.send({
      to: email,
      from: env.SENDGRID_FROM_EMAIL,
      templateId: passwordResetTemplateId,
      dynamicTemplateData: {
        resetUrl,
        expiresMinutes: 15
      }
    })
    return
  }

  await sgMail.send({
    to: email,
    from: env.SENDGRID_FROM_EMAIL,
    subject: '有搭密码重置',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>密码重置请求</h2>
        <p>你正在为有搭账号申请重置密码。</p>
        <p>请在 15 分钟内点击下方链接完成操作：</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
    `
  })
}

export async function sendSuspiciousLoginEmail(email: string, ipAddress: string, userAgent: string) {
  if (!sendgridEnabled) {
    console.info(
      JSON.stringify({
        level: 'warn',
        event: 'mailer.suspicious-login.skipped',
        email,
        ipAddress,
        userAgent
      })
    )
    return
  }

  if (suspiciousLoginTemplateId) {
    await sgMail.send({
      to: email,
      from: env.SENDGRID_FROM_EMAIL,
      templateId: suspiciousLoginTemplateId,
      dynamicTemplateData: {
        ipAddress,
        userAgent
      }
    })
    return
  }

  await sgMail.send({
    to: email,
    from: env.SENDGRID_FROM_EMAIL,
    subject: '有搭异地登录提醒',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>检测到新的登录环境</h2>
        <p>登录 IP：${ipAddress}</p>
        <p>设备信息：${userAgent}</p>
        <p>如果这不是你本人操作，请立即修改密码并重新验证当前会话。</p>
      </div>
    `
  })
}

export async function sendLoginChallengeEmail(email: string, challengeUrl: string) {
  if (!sendgridEnabled) {
    console.info(
      JSON.stringify({
        level: 'warn',
        event: 'mailer.login-challenge.skipped',
        email,
        challengeUrl
      })
    )
    return
  }

  if (loginChallengeTemplateId) {
    await sgMail.send({
      to: email,
      from: env.SENDGRID_FROM_EMAIL,
      templateId: loginChallengeTemplateId,
      dynamicTemplateData: {
        challengeUrl,
        expiresMinutes: 15
      }
    })
    return
  }

  await sgMail.send({
    to: email,
    from: env.SENDGRID_FROM_EMAIL,
    subject: '有搭登录环境验证',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>请验证新的登录环境</h2>
        <p>我们检测到一个新的登录环境。</p>
        <p>请在 15 分钟内点击下方链接完成验证：</p>
        <p><a href="${challengeUrl}">${challengeUrl}</a></p>
      </div>
    `
  })
}
