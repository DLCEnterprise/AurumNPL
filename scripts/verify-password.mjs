import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const p = new PrismaClient()

const email = 'r.calloway@northchase-nh.com'
const tryPassword = 'Demo!2026Aurum'

const user = await p.user.findUnique({ where: { email } })
if (!user) { console.log('NO USER'); process.exit(1) }
console.log(`user found: ${user.id}, hash length: ${user.passwordHash?.length}, approvalStatus: ${user.approvalStatus}, termsVersion: ${user.termsVersion}`)

const ok = user.passwordHash ? await bcrypt.compare(tryPassword, user.passwordHash) : false
console.log(`password "${tryPassword}" valid: ${ok}`)
await p.$disconnect()
