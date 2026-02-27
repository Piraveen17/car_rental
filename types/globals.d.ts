export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'admin' | 'staff' | 'customer'
    }
  }
}
