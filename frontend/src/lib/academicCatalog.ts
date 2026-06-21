export const FACULTY_OPTIONS = [
  'Khoa Cơ khí - Công nghệ',
  'Khoa Chăn nuôi Thú y',
  'Khoa Công nghệ Hóa học và Thực phẩm',
  'Khoa Công nghệ Thông tin',
  'Khoa Kinh tế',
  'Khoa Lâm nghiệp',
  'Khoa Môi trường và Tài nguyên',
  'Khoa Ngoại ngữ - Sư phạm',
  'Khoa Nông học',
  'Khoa Quản lý đất đai và Bất động sản',
  'Khoa Sinh học',
  'Khoa Thủy sản',
];

export const ACADEMIC_TITLE_OPTIONS = [
  'Thạc sĩ',
  'Tiến sĩ',
  'PGS. Tiến sĩ',
  'GS. Tiến sĩ',
];

export const ACADEMIC_YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => {
  const start = 2016 + index;
  return `K${String(start).slice(-2)} (${start} - ${start + 4})`;
}).reverse();

export const campusLabel = (campus: string) => campus === 'NLN' ? 'Phân hiệu Ninh Thuận' : 'Cơ sở chính TP.HCM';
