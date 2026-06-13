export function shouldShowRegistrarOverview(role: string | null) {
  return role === 'REGISTRAR' || role === 'ADMIN';
}
