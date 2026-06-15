export function dashboardPathForRole(role: string | null | undefined): string {
  switch (role) {
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    case 'PRINCIPAL':
      return '/principal/dashboard';
    case 'REGISTRAR':
      return '/registrar/dashboard';
    case 'FINANCE':
      return '/registrar-finance/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/auth/login';
  }
}
