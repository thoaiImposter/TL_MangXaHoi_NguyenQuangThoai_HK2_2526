import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, UserRole } from '../types';

type RegistrationStep = 'email' | 'otp' | 'details';

const ROLE_OPTIONS: { value: UserRole; label: string; icon: string; description: string }[] = [
  { value: 'student', label: 'Sinh viên', icon: '🎓', description: 'Sinh viên trường ĐH Nông Lâm TP.HCM' },
  { value: 'advisor', label: 'Cố vấn học tập', icon: '👨‍🏫', description: 'Giảng viên phụ trách cố vấn lớp' },
  { value: 'faculty_union', label: 'Đoàn khoa', icon: '🏫', description: 'Ban chấp hành Đoàn khoa' },
  { value: 'school_union', label: 'Đoàn trường', icon: '🏛️', description: 'Ban chấp hành Đoàn trường' },
];

const ACADEMIC_TITLE_OPTIONS = [
  'Thạc sĩ',
  'Tiến sĩ',
  'PGS. Tiến sĩ',
  'GS. Tiến sĩ',
];

function RegisterPage({ onAuth }: { onAuth: (user: User) => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegistrationStep>('email');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<number | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    fullName: '',
    avatar: '',
    bio: '',
    faculty: '',
    className: '',
    academicYear: '',
    academicTitle: '',
  });

  const [otpConfig, setOtpConfig] = useState({
    expiresIn: 5,
    maxAttempts: 5,
    resendCooldown: 30,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown]);

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const validateEmail = (email: string): string | null => {
    if (selectedRole === 'student') {
      const pattern = /^\d{8}@st\.hcmuaf\.edu\.vn$/;
      if (!pattern.test(email)) {
        return 'Email sinh viên phải có dạng 8 số + @st.hcmuaf.edu.vn (vd: 21045678@st.hcmuaf.edu.vn)';
      }
    } else {
      if (!email.endsWith('@hcmuaf.edu.vn')) {
        return 'Email phải có đuôi @hcmuaf.edu.vn';
      }
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/[a-z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!/\d/.test(password)) return 'Mật khẩu phải có ít nhất 1 số';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
    return null;
  };

  const updatePasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    try {
      const result = await api.requestRegistrationOtp(email.toLowerCase(), selectedRole);
      setCountdown(result.expiresIn * 60);
      if (result.maxAttempts) {
        setOtpConfig({
          expiresIn: result.expiresIn,
          maxAttempts: result.maxAttempts,
          resendCooldown: result.resendCooldown || 30,
        });
      }
      setSuccessMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (và mục Spam/Quảng cáo).');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (otp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số');
      setLoading(false);
      return;
    }

    setStep('details');
    setLoading(false);
    setSuccessMessage('');
  };

  const handleOtpInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setOtp(cleaned);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      setOtp(pastedData);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await api.resendRegistrationOtp(email.toLowerCase(), selectedRole);
      setCountdown(result.expiresIn * 60);
      setOtp('');
      setSuccessMessage('Mã OTP mới đã được gửi đến email của bạn.');

      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (selectedRole === 'advisor') {
      if (!formData.academicTitle) {
        setError('Vui lòng chọn học vị');
        setLoading(false);
        return;
      }
      if (!formData.faculty.trim()) {
        setError('Vui lòng nhập khoa phụ trách');
        setLoading(false);
        return;
      }
    } else if (selectedRole === 'faculty_union') {
      if (!formData.faculty.trim()) {
        setError('Vui lòng nhập khoa quản lý');
        setLoading(false);
        return;
      }
    }

    try {
      const user = await api.register({
        email: email.toLowerCase(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        role: selectedRole,
        avatar: formData.avatar,
        bio: formData.bio,
        faculty: formData.faculty,
        className: selectedRole === 'student' ? formData.className : undefined,
        academicYear: selectedRole === 'student' ? formData.academicYear : undefined,
        academicTitle: selectedRole === 'advisor' ? formData.academicTitle : undefined,
        otp: otp,
      });
      onAuth(user);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getPasswordStrengthLabel = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return { text: 'Yếu', color: '#ef4444' };
    if (score <= 3) return { text: 'Trung bình', color: '#f59e0b' };
    if (score <= 4) return { text: 'Mạnh', color: '#3b82f6' };
    return { text: 'Rất mạnh', color: '#22c55e' };
  };

  const getStrengthSegmentClass = (index: number) => {
    const score = getPasswordStrengthScore();
    if (index >= score) return '';
    if (score <= 2) return 'active-weak';
    if (score <= 3) return 'active-medium';
    return 'active-strong';
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🌿</div>
          <h1 className="auth-title">
            {step === 'email' && 'Tạo tài khoản mới'}
            {step === 'otp' && 'Xác minh email'}
            {step === 'details' && 'Hoàn tất thông tin'}
          </h1>
          <p className="auth-subtitle">
            {step === 'email' && 'Chọn loại tài khoản và nhập email để bắt đầu.'}
            {step === 'otp' && 'Nhập mã OTP đã được gửi đến email của bạn.'}
            {step === 'details' && 'Cung cấp thông tin cá nhân để hoàn tất.'}
          </p>
        </div>

        <form className="auth-body" onSubmit={step === 'email' ? handleRequestOtp : step === 'otp' ? handleVerifyOtp : handleCompleteRegistration}>
          {error && (
            <div className="alert alert-error mb-lg">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success mb-lg">
              <span>✅</span>
              {successMessage}
            </div>
          )}

          {/* Step 1: Role + Email */}
          {step === 'email' && (
            <>
              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label">Loại tài khoản</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setSelectedRole(opt.value); setEmail(''); setError(''); }}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-lg)',
                        border: selectedRole === opt.value ? '2px solid var(--primary)' : '2px solid var(--gray-200)',
                        background: selectedRole === opt.value ? 'var(--primary-50, #eff6ff)' : 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{opt.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: selectedRole === opt.value ? '700' : '500', color: selectedRole === opt.value ? 'var(--primary)' : 'var(--gray-700)' }}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {selectedRole === 'student' ? 'Email sinh viên' : 'Email trường'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                    📧
                  </span>
                  <input
                    type="email"
                    className="form-input"
                    placeholder={selectedRole === 'student' ? '21045678@st.hcmuaf.edu.vn' : 'example@hcmuaf.edu.vn'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
                <p className="text-muted text-sm mt-sm">
                  {selectedRole === 'student'
                    ? 'Định dạng: 8 chữ số + @st.hcmuaf.edu.vn'
                    : 'Định dạng: @hcmuaf.edu.vn'}
                </p>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                    Đang gửi OTP...
                  </>
                ) : (
                  'Gửi mã xác thực'
                )}
              </button>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <>
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                  <strong>ℹ️ Lưu ý:</strong> Mã OTP đã được gửi đến <strong>{email}</strong>. Kiểm tra cả hộp thư Spam/Quảng cáo nếu không thấy.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Mã OTP (6 chữ số)</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="form-input"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => handleOtpInput(e.target.value)}
                  onPaste={handleOtpPaste}
                  required
                  disabled={loading}
                  style={{ textAlign: 'center', fontSize: '32px', letterSpacing: '12px', fontFamily: 'monospace', fontWeight: '700' }}
                />
              </div>

              <div className="text-center mb-lg">
                {countdown > 0 ? (
                  <p className="text-muted text-sm">
                    Gửi lại sau <strong>{formatTime(countdown)}</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', textDecoration: 'underline', padding: 0 }}
                    disabled={loading}
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading || otp.length !== 6} style={{ width: '100%' }}>
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                    Đang xác minh...
                  </>
                ) : (
                  'Xác minh OTP'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                style={{ marginTop: 'var(--spacing-md)', background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '14px', width: '100%', padding: '8px' }}
                disabled={loading}
              >
                ← Quay lại
              </button>
            </>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                    🔒
                  </span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Ít nhất 8 ký tự"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      updatePasswordStrength(e.target.value);
                    }}
                    required
                    disabled={loading}
                    autoFocus
                    style={{ paddingLeft: '48px' }}
                  />
                </div>

                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`strength-segment ${getStrengthSegmentClass(i)}`} />
                      ))}
                    </div>
                    <p className="strength-text" style={{ color: getPasswordStrengthLabel().color }}>
                      Độ mạnh: <strong>{getPasswordStrengthLabel().text}</strong>
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', marginTop: '6px' }}>
                      <span style={{ color: passwordStrength.length ? '#22c55e' : '#94a3b8' }}>
                        {passwordStrength.length ? '✓' : '○'} 8+ ký tự
                      </span>
                      <span style={{ color: passwordStrength.uppercase ? '#22c55e' : '#94a3b8' }}>
                        {passwordStrength.uppercase ? '✓' : '○'} Chữ hoa
                      </span>
                      <span style={{ color: passwordStrength.lowercase ? '#22c55e' : '#94a3b8' }}>
                        {passwordStrength.lowercase ? '✓' : '○'} Chữ thường
                      </span>
                      <span style={{ color: passwordStrength.number ? '#22c55e' : '#94a3b8' }}>
                        {passwordStrength.number ? '✓' : '○'} Số
                      </span>
                      <span style={{ color: passwordStrength.special ? '#22c55e' : '#94a3b8' }}>
                        {passwordStrength.special ? '✓' : '○'} Ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                    🔒
                  </span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>Mật khẩu không khớp</span>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <span style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', display: 'block' }}>✓ Mật khẩu khớp</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                    👤
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {selectedRole === 'advisor' && (
                <div className="form-group">
                  <label className="form-label">Học vị *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                      🎖️
                    </span>
                    <select
                      className="form-input"
                      value={formData.academicTitle}
                      onChange={(e) => setFormData({ ...formData, academicTitle: e.target.value })}
                      required
                      disabled={loading}
                      style={{ paddingLeft: '48px', appearance: 'auto' }}
                    >
                      <option value="">-- Chọn học vị --</option>
                      {ACADEMIC_TITLE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Faculty field - for student, advisor, faculty_union */}
              {selectedRole !== 'school_union' && (
                <div className="form-group">
                  <label className="form-label">
                    {selectedRole === 'student' ? 'Tên khoa' : selectedRole === 'advisor' ? 'Khoa phụ trách *' : 'Khoa quản lý *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                      🎓
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Khoa Công nghệ Thông tin"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      required={selectedRole !== 'student'}
                      disabled={loading}
                      style={{ paddingLeft: '48px' }}
                    />
                  </div>
                </div>
              )}

              {/* Student-only fields */}
              {selectedRole === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tên lớp</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                        📚
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="CNTT01"
                        value={formData.className}
                        onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                        disabled={loading}
                        style={{ paddingLeft: '48px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Niên khóa</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                        📅
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="2021-2025"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                        disabled={loading}
                        style={{ paddingLeft: '48px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Avatar (tùy chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Kích thước ảnh không quá 5MB');
                      return;
                    }
                    if (!file.type.startsWith('image/')) {
                      setError('Vui lòng chọn file ảnh');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setFormData((current) => ({ ...current, avatar: String(reader.result ?? '') }));
                    reader.readAsDataURL(file);
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio (tùy chọn)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="Giới thiệu ngắn về bản thân (tối đa 500 ký tự)"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={loading}
                />
                {formData.bio && (
                  <span className="text-muted text-sm">
                    {formData.bio.length}/500 ký tự
                  </span>
                )}
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                    Đang đăng ký...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('otp')}
                style={{ marginTop: 'var(--spacing-md)', background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '14px', width: '100%', padding: '8px' }}
                disabled={loading}
              >
                ← Quay lại
              </button>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;