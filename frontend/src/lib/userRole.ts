import type { User, UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Sinh viên',
  advisor: 'Giảng viên / Cố vấn học tập',
  faculty_union: 'Đoàn khoa',
  school_union: 'Đoàn trường',
  admin: 'Quản trị viên',
};

export const hasFaculty = (role: UserRole) => role !== 'school_union' && role !== 'admin';
export const hasStudentDetails = (role: UserRole) => role === 'student';
export const hasAcademicTitle = (role: UserRole) => role === 'advisor';

export function getRoleProfileDetails(user: User): [string, string][] {
  const details: [string, string][] = [['Vai trò', ROLE_LABELS[user.role]]];

  if (hasFaculty(user.role) && user.faculty) details.push(['Khoa', user.faculty]);
  if (hasStudentDetails(user.role) && user.majorName) details.push(['Ngành', `${user.majorName}${user.majorCode ? ` (${user.majorCode})` : ''}`]);
  if (hasStudentDetails(user.role) && user.majorCampus) details.push(['Cơ sở đào tạo', user.majorCampus === 'NLN' ? 'Phân hiệu Ninh Thuận' : 'Cơ sở chính TP.HCM']);
  if (hasStudentDetails(user.role) && user.className) details.push(['Lớp', user.className]);
  if (hasStudentDetails(user.role) && user.academicYear) details.push(['Niên khóa', user.academicYear]);
  if (hasAcademicTitle(user.role) && user.academicTitle) details.push(['Học vị', user.academicTitle]);

  return details;
}
