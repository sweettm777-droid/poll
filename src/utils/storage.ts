import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SurveyResponse } from '../types/survey';
import { COURSES } from '../data/courses';

const SETTINGS_KEY = 'hyoseong_survey_settings_v2';
export const DEFAULT_ADMIN_PASSWORD = 'gytjd12345^';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

// ====================== Firestore 클라우드 통신 함수 ======================

// 1. 학생 설문 제출 (클라우드 DB에 실시간 저장)
export async function submitSurvey(selectedCourses: string[]): Promise<SurveyResponse> {
  const path = 'surveys';
  const submittedAt = new Date().toISOString();
  try {
    const docRef = await addDoc(collection(db, path), {
      selectedCourses,
      submittedAt,
    });
    return {
      id: docRef.id,
      selectedCourses,
      submittedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// 2. 관리자 실시간 설문 응답 구독 (onSnapshot - 모든 기기의 제출이 0.1초만에 동기화)
export function subscribeToSurveys(
  onData: (responses: SurveyResponse[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'surveys';
  try {
    const q = query(collection(db, path), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SurveyResponse[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            selectedCourses: data.selectedCourses || [],
            submittedAt: data.submittedAt || new Date().toISOString(),
          };
        });
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 3. 단건 삭제
export async function deleteSurvey(id: string): Promise<void> {
  const path = `surveys/${id}`;
  try {
    await deleteDoc(doc(db, 'surveys', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 4. 전체 삭제 (관리자 초기화)
export async function clearAllSurveys(currentList: SurveyResponse[]): Promise<void> {
  const path = 'surveys';
  try {
    await Promise.all(currentList.map(item => deleteDoc(doc(db, 'surveys', item.id))));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 5. 모의 샘플 데이터 생성 (클라우드에 바로 저장)
export async function generateSampleSurveysToCloud(): Promise<void> {
  const path = 'surveys';
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
  try {
    await Promise.all(
      samplePicks.map((courses, idx) => 
        addDoc(collection(db, path), {
          selectedCourses: courses,
          submittedAt: new Date(now - (samplePicks.length - idx) * 3600000 * 2).toISOString(),
        })
      )
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ====================== 통계 및 엑셀 내보내기 ======================

export function exportToCSV(responses: SurveyResponse[]): void {
  if (responses.length === 0) {
    alert('내보낼 응답 데이터가 없습니다.');
    return;
  }

  const headers = ['연번', '응답ID', '제출일시', '선택과목수', '선택과목목록'];
  
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
  link.setAttribute('download', `효성고_2027_온라인공동교육과정_수요조사_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
