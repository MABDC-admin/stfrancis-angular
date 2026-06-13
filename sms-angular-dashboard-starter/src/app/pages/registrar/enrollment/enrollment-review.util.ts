export function shouldBlockEnrollmentReview(status: string): boolean {
  return status === 'Officially Enrolled';
}
