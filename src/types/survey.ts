export type TrackType = '일반선택' | '진로선택' | '융합선택' | '전문·심화';

export interface Course {
  id: string;
  name: string;
  category: string; // 교과(군): 국어, 수학, 영어, 사회, 과학, 정보·기술가정, 체육, 예술, 제2외국어·한문, 교양
  trackType: TrackType;
  group?: string; // 세부 구분 (예: 음악, 미술, 무용, 독일어 등)
  isSpecialized?: boolean; // 전문교과/특목 계열 여부
}

export interface SurveyResponse {
  id: string;
  selectedCourses: string[]; // 과목 이름 목록 (복수 선택)
  submittedAt: string; // ISO string
}

export interface AdminSettings {
  adminPasswordHash: string;
  surveyOpen: boolean;
  surveyNotice: string;
}
