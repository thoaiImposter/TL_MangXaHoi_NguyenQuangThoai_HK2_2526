import type { User, UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Sinh viên',
  advisor: 'Giảng viên / Cố vấn học tập',
  faculty_union: 'Đoàn khoa',
  school_union: 'Đoàn trường',
};

export const hasFaculty = (role: UserRole) => role !== 'school_union';
export const hasStudentDetails = (role: UserRole) => role === 'student';
export const hasAcademicTitle = (role: UserRole) => role === 'advisor';

export function getRoleProfileDetails(user: User): [string, string][] {
  const details: [string, string][] = [['Vai trò', ROLE_LABELS[user.role]]];

  if (hasFaculty(user.role) && user.faculty) details.push(['Khoa', user.faculty]);
  if (hasStudentDetails(user.role) && user.className) details.push(['Lớp', user.className]);
  if (hasStudentDetails(user.role) && user.academicYear) details.push(['Niên khóa', user.academicYear]);
  if (hasAcademicTitle(user.role) && user.academicTitle) details.push(['Học vị', user.academicTitle]);

  return details;
}
