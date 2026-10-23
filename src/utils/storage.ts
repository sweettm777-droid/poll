import { SurveyResponse } from '../types/survey';
import { COURSES } from '../data/courses';

const RESPONSES_KEY = 'hyoseong_survey_responses_v2'; // 새로운 간소화 버전에 맞게 키 분리
const SETTINGS_KEY = 'hyoseong_survey_settings_v2';

export const DEFAULT_ADMIN_PASSWORD = 'gytjd12345^';

export function getAdminPassword(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.adminPassword) return parsed.adminPassword;
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(newPassword: string): void {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const prev = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...prev, adminPassword: newPassword })
    );
  } catch (e) {
    console.error(e);
  }
}

export function getResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(RESPONSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse survey responses', e);
    return [];
  }
}

export function saveResponse(newResponse: Omit<SurveyResponse, 'id' | 'submittedAt'>): SurveyResponse {
  const responses = getResponses();
  const created: SurveyResponse = {
    ...newResponse,
    id: 'resp_' + Date.now().toString().slice(-6) + '_' + Math.random().toString(36).substring(2, 5),
    submittedAt: new Date().toISOString(),
  };
  const updated = [created, ...responses];
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(updated));
  return created;
}

export function deleteResponse(id: string): void {
  const responses = getResponses();
  const updated = responses.filter(r => r.id !== id);
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(updated));
}

export function clearAllResponses(): void {
  localStorage.setItem(RESPONSES_KEY, JSON.stringify([]));
}

// 엑셀(CSV) 다운로드 함수
export function exportToCSV(responses: SurveyResponse[]): void {
  if (responses.length === 0) {
    alert('내보낼 응답 데이터가 없습니다.');
    return;
  }

  const headers = ['연번', '응답번호', '제출일시', '선택과목수', '선택과목목록'];
  
  const rows = responses.map((r, idx) => {
    const dateStr = new Date(r.submittedAt).toLocaleString('ko-KR');
    const coursesStr = r.selectedCourses.join(', ');

    return [
      idx + 1,
      `"${r.id}"`,
      `"${dateStr}"`,
      r.selectedCourses.length,
      `"${coursesStr.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `효성고_온라인공동교육과정_수요조사_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 통계 집계 유틸
export interface CourseStat {
  name: string;
  category: string;
  count: number;
  percentage: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export function computeCourseStats(responses: SurveyResponse[]): {
  totalResponses: number;
  totalCourseVotes: number;
  topCourses: CourseStat[];
  categoryStats: CategoryStat[];
} {
  const totalResponses = responses.length;
  let totalCourseVotes = 0;
  const courseCounts: { [courseName: string]: number } = {};
  const categoryCounts: { [category: string]: number } = {};

  // 과목명 -> 카테고리 매핑 캐시
  const courseCategoryMap = new Map<string, string>();
  COURSES.forEach(c => courseCategoryMap.set(c.name, c.category));

  responses.forEach(r => {
    r.selectedCourses.forEach(cName => {
      totalCourseVotes++;
      courseCounts[cName] = (courseCounts[cName] || 0) + 1;
      const cat = courseCategoryMap.get(cName) || '기타';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  const topCourses: CourseStat[] = Object.entries(courseCounts)
    .map(([name, count]) => ({
      name,
      category: courseCategoryMap.get(name) || '기타',
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const categoryStats: CategoryStat[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCourseVotes > 0 ? Math.round((count / totalCourseVotes) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalResponses,
    totalCourseVotes,
    topCourses,
    categoryStats,
  };
}

// 모의 샘플 데이터 생성기 (관리자 시연 및 테스트 용도)
export function generateSampleResponses(): void {
  const samplePicks = [
    ['인공지능 수학', '데이터 과학', '고급 물리학', '로봇과 공학세계'],
    ['고급 생명과학', '생명과학 실험', '세포와 물질대사'],
    ['국제 정치', '국제 경제', '세계 문제와 미래 사회'],
    ['심화 영어', '심화 영어 독해와 작문', '미디어 영어'],
    ['고급 미적분', '인공지능 수학', '물리학 실험'],
    ['미술 매체 탐구', '조형 탐구', '드로잉'],
    ['전공 기초 일본어', '일본어 회화', '일본 문화'],
    ['인간과 철학', '인간과 심리', '논술'],
    ['고급 화학', '화학 실험', '물질과 에너지'],
    ['창의 공학 설계', '소프트웨어와 생활', '정보과학'],
    ['스포츠 과학', '스포츠 생리의학', '스포츠 경기 분석'],
    ['연극과 삶', '영화의 이해', '영상 제작의 이해'],
    ['인공지능 기초', '데이터 과학', '인공지능 수학'],
    ['고급 생명과학', '화학 실험', '생명과학 실험'],
    ['국제 관계의 이해', '한국 사회의 이해', '지역 이해'],
  ];

  const now = Date.now();
  const mockResponses: SurveyResponse[] = samplePicks.map((courses, idx) => ({
    id: `resp_${idx + 101}`,
    selectedCourses: courses,
    submittedAt: new Date(now - (samplePicks.length - idx) * 3600000 * 3).toISOString(),
  }));

  const current = getResponses();
  const merged = [...mockResponses, ...current];
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(merged));
}
