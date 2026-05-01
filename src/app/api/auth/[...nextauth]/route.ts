// NextAuth v5 catch-all route — handles GET/POST for all auth endpoints.
import { handlers } from '@/server/auth/index'

// Export all handler methods so NextAuth endpoints (callbacks, csrf, etc.)
// are correctly handled by the app router.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = handlers