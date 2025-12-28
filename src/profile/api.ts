import { mockProfileApi } from '@/mocks/profile/mockProfileApi';

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

interface UserProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  emailVerifiedAt?: string | null;
  issuer?: string | null;
  audience?: string[] | null;
}

interface LearningEnrollmentResponse {
  courseId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REVOKED';
  enrolledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  lastActivityAt?: string | null;
}

interface CourseDtoResponse {
  id: string;
  title: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  membersCount?: number | null;
  avgCompletion?: number | null;
  avgRating?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  lessons?: Array<unknown> | null;
}

export type LearningStatus = 'in_progress' | 'completed' | 'not_started';
export type AuthoredStatus = 'published' | 'draft' | 'archived';

export interface LearningCourse {
  id: string;
  title: string;
  author: string;
  progress: number;
  status: LearningStatus;
  lastActivity: string;
  lastLesson?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  lessonsCompleted?: number;
  lessonsTotal?: number;
  chapters?: Array<{ title: string; progress: number }>;
  averageScore?: number;
  codingTasksSolved?: number;
}

export interface AuthoredCourse {
  id: string;
  title: string;
  status: AuthoredStatus;
  students: number;
  averageProgress: number;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  lessons?: number;
  publishedAt?: string;
  totalChapters?: number;
  popularLessons?: Array<{ title: string; views: number }>;
  hardestLessons?: Array<{ title: string; completion: number }>;
  averageTestScore?: number;
  codingSuccess?: number;
  activeStudents?: number;
  completionRate?: number;
}

export interface ProfileUpdateInput {
  name: string;
  bio?: string;
}

export interface PasswordChangeInput {
  current: string;
  next: string;
  confirm?: string;
}

export interface ProfileApi {
  getProfile(): Promise<UserProfile>;
  updateProfile(payload: ProfileUpdateInput): Promise<UserProfile>;
  uploadAvatar(file: File): Promise<string>;
  deleteAvatar(): Promise<void>;
  changePassword(payload: PasswordChangeInput): Promise<void>;
  getLearningCourses(): Promise<LearningCourse[]>;
  getLearningDetails(courseId: string): Promise<LearningCourse | null>;
  getAuthoredCourses(statuses?: AuthoredStatus[]): Promise<AuthoredCourse[]>;
  getAuthoredCourseDetails(courseId: string): Promise<AuthoredCourse | null>;
  exportUserData(): Promise<{ filename: string; content: string; mimeType: string }>;
  deleteAccount(payload: { password: string }): Promise<void>;
  unenrollFromCourse(courseId: string): Promise<void>;
}

const USE_MOCKS = (import.meta.env.VITE_PROFILE_USE_MOCKS as string | undefined) !== 'false';
const API_BASE = (import.meta.env.VITE_BACKEND_API as string) ?? '/api';
const LEARNING_API_BASE = (import.meta.env.VITE_LEARNING_API as string | undefined) ?? API_BASE;
const STORAGE_KEY = 'oh-front-auth-session';

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
};

const buildHeaders = (options?: { withContentType?: boolean }) => {
  const headers: Record<string, string> = {};
  if (options?.withContentType !== false) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    let errorData: { message?: string; code?: string } | undefined;
    try {
      errorData = await res.json();
    } catch {
      // ignore parsing errors
    }
    const errorMessage = errorData?.code || errorData?.message || `Error ${res.status}`;
    throw new Error(errorMessage);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
};

const mapProfileResponse = (data: UserProfileResponse): UserProfile => ({
  name: data.fullName ?? '',
  email: data.email ?? '',
  bio: data.bio ?? undefined,
  avatarUrl: data.avatarUrl ?? undefined,
});

const mapEnrollmentStatus = (status: LearningEnrollmentResponse['status']): LearningStatus => {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'IN_PROGRESS') return 'in_progress';
  return 'not_started';
};

const formatDate = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const pickEnrollmentDate = (data: LearningEnrollmentResponse): string => {
  return formatDate(data.lastActivityAt ?? data.completedAt ?? data.startedAt ?? data.enrolledAt ?? null);
};

const mapEnrollmentResponse = (data: LearningEnrollmentResponse): LearningCourse => ({
  id: data.courseId,
  title: '',
  author: '',
  progress: 0,
  status: mapEnrollmentStatus(data.status),
  lastActivity: pickEnrollmentDate(data),
});

const mapCourseStatus = (status: CourseDtoResponse['status']): AuthoredStatus => {
  if (status === 'PUBLISHED') return 'published';
  if (status === 'ARCHIVED') return 'archived';
  return 'draft';
};

const normalizePercent = (value?: number | null): number => {
  if (value == null || Number.isNaN(value)) return 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
};

const mapCourseResponse = (data: CourseDtoResponse): AuthoredCourse => ({
  id: data.id,
  title: data.title ?? '',
  status: mapCourseStatus(data.status),
  students: data.membersCount ?? 0,
  averageProgress: normalizePercent(data.avgCompletion),
  createdAt: data.createdAt ?? '',
  updatedAt: data.updatedAt ?? '',
  rating: data.avgRating ?? undefined,
  lessons: data.lessons?.length ?? undefined,
  publishedAt: data.publishedAt ?? undefined,
});

const realProfileApi: ProfileApi = {
  async getProfile() {
    const data = await handleResponse<UserProfileResponse>(
      await fetch(`${API_BASE}/profile`, {
        headers: buildHeaders(),
        credentials: 'include',
      }),
    );
    return mapProfileResponse(data);
  },
  async updateProfile(payload) {
    const data = await handleResponse<{ message?: string; profile: UserProfileResponse }>(
      await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ fullName: payload.name, bio: payload.bio }),
        credentials: 'include',
      }),
    );
    return mapProfileResponse(data.profile);
  },
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const data = await handleResponse<{ message?: string; avatarUrl: string }>(
      await fetch(`${API_BASE}/profile/avatar`, {
        method: 'POST',
        headers: buildHeaders({ withContentType: false }),
        body: formData,
        credentials: 'include',
      }),
    );
    return data.avatarUrl;
  },
  async deleteAvatar() {
    await handleResponse(
      await fetch(`${API_BASE}/profile/avatar`, {
        method: 'DELETE',
        headers: buildHeaders(),
        credentials: 'include',
      }),
    );
  },
  async changePassword(payload) {
    await handleResponse(
      await fetch(`${API_BASE}/auth/password/change`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          currentPassword: payload.current,
          newPassword: payload.next,
          newPasswordConfirmation: payload.confirm ?? payload.next,
        }),
        credentials: 'include',
      }),
    );
  },
  async getLearningCourses() {
    const res = await fetch(`${LEARNING_API_BASE}/learning/enrollments`, {
      headers: buildHeaders(),
      credentials: 'include',
    });
    if (res.status === 404) return [];
    const data = await handleResponse<LearningEnrollmentResponse[]>(res);
    return data.map(mapEnrollmentResponse);
  },
  async getLearningDetails(courseId: string) {
    const res = await fetch(`${LEARNING_API_BASE}/learning/enrollments/${courseId}`, {
      headers: buildHeaders(),
      credentials: 'include',
    });
    if (res.status === 404) return null;
    const data = await handleResponse<LearningEnrollmentResponse>(res);
    return mapEnrollmentResponse(data);
  },
  async getAuthoredCourses(statuses) {
    const params = new URLSearchParams();
    if (statuses?.length) {
      statuses.forEach((status) => params.append('status', status.toUpperCase()));
    }
    const query = params.toString();
    const res = await fetch(`${API_BASE}/courses/my${query ? `?${query}` : ''}`, {
      headers: buildHeaders(),
      credentials: 'include',
    });
    if (res.status === 404) return [];
    const data = await handleResponse<CourseDtoResponse[]>(res);
    return data.map(mapCourseResponse);
  },
  async getAuthoredCourseDetails(courseId: string) {
    const res = await fetch(`${API_BASE}/courses/${courseId}/details`, {
      headers: buildHeaders(),
      credentials: 'include',
    });
    if (res.status === 404) return null;
    const data = await handleResponse<CourseDtoResponse>(res);
    return mapCourseResponse(data);
  },
  async exportUserData() {
    throw new Error('Profile API is not implemented yet');
  },
  async deleteAccount() {
    throw new Error('Profile API is not implemented yet');
  },
  async unenrollFromCourse() {
    throw new Error('Profile API is not implemented yet');
  },
};

export const profileApi: ProfileApi = USE_MOCKS ? mockProfileApi : realProfileApi;
