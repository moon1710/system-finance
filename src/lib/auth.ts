import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

export function generateTemporaryPassword(): string {
  return nanoid(8)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}