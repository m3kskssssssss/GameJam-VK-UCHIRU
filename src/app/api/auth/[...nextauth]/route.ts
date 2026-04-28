// NextAuth v5 catch-all route — handles GET/POST for all auth endpoints.
import { handlers } from '@/server/auth/index'

export const { GET, POST } = handlers
