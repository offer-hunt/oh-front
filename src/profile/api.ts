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
}

export interface ProfileApi {
  getProfile(): Promise<UserProfile>;
  updateProfile(payload: ProfileUpdateInput): Promise<UserProfile>;
  uploadAvatar(file: File): Promise<string>;
  deleteAvatar(): Promise<void>;
  changePassword(payload: PasswordChangeInput): Promise<void>;
  getLearningCourses(): Promise<LearningCourse[]>;
  getLearningDetails(courseId: string): Promise<LearningCourse | null>;
  getAuthoredCourses(): Promise<AuthoredCourse[]>;
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
  async changePassword() {
    throw new Error('Profile API is not implemented yet');
  },
  async getLearningCourses() {
    const res = await fetch(`${LEARNING_API_BASE}/learning/courses`, {
      headers: buildHeaders(),
      credentials: 'include',
    });
    if (res.status === 404) return [];
    return handleResponse<LearningCourse[]>(res);
  },
  async getLearningDetails() {
    throw new Error('Profile API is not implemented yet');
  },
  async getAuthoredCourses() {
    const res = await fetch(`${API_BASE}/courses/my`, {
      headers: buildHeaders(),
      credentials: 'include',
    });
    if (res.status === 404) return [];
    return handleResponse<AuthoredCourse[]>(res);
  },
  async getAuthoredCourseDetails() {
    throw new Error('Profile API is not implemented yet');
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
