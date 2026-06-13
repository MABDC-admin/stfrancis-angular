export function shouldLoadEnrollmentApplications(role: string | null) {
  return role === 'REGISTRAR' || role === 'ADMIN';
}
