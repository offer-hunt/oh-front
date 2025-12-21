import { mockProfileApi } from '@/mocks/profile/mockProfileApi';

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
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

const realProfileApi: ProfileApi = {
  async getProfile() {
    throw new Error('Profile API is not implemented yet');
  },
  async updateProfile() {
    throw new Error('Profile API is not implemented yet');
  },
  async uploadAvatar() {
    throw new Error('Profile API is not implemented yet');
  },
  async deleteAvatar() {
    throw new Error('Profile API is not implemented yet');
  },
  async changePassword() {
    throw new Error('Profile API is not implemented yet');
  },
  async getLearningCourses() {
    throw new Error('Profile API is not implemented yet');
  },
  async getLearningDetails() {
    throw new Error('Profile API is not implemented yet');
  },
  async getAuthoredCourses() {
    throw new Error('Profile API is not implemented yet');
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
