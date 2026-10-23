import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Trash2, 
  Search, 
  Sparkles, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  BookOpen, 
  X,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { SurveyResponse } from '../types/survey';
import { 
  getResponses, 
  deleteResponse, 
  clearAllResponses, 
  exportToCSV, 
  computeCourseStats, 
  generateSampleResponses,
  setAdminPassword
} from '../utils/storage';

interface AdminDashboardProps {
  onBackToSurvey: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSurvey, onLogout }) => {
  const [responses, setResponses] = useState<SurveyResponse[]>(() => getResponses());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('전체');

  // 비밀번호 변경 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // 탭 상태 (과목 순위 / 전체 응답 내역 / 교과군 분석)
  const [activeTab, setActiveTab] = useState<'ranking' | 'list' | 'categories'>('ranking');

  const reloadData = () => {
    setResponses(getResponses());
  };

  const handleDelete = (id: string) => {
    if (confirm(`응답 #${id} 데이터를 삭제하시겠습니까?`)) {
      deleteResponse(id);
      reloadData();
    }
  };

  const handleClearAll = () => {
    if (confirm('주의: 모든 설문 응답 데이터를 영구적으로 초기화하시겠습니까?')) {
      clearAllResponses();
      reloadData();
    }
  };

  const handleGenerateSamples = () => {
    generateSampleResponses();
    reloadData();
    alert('모의 설문 응답 15건이 생성되었습니다.');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 3) {
      alert('비밀번호는 최소 3글자 이상이어야 합니다.');
      return;
    }
    setAdminPassword(newPassword.trim());
    setPasswordChangeSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordChangeSuccess(false);
      setNewPassword('');
    }, 1200);
  };

  // 통계 계산
  const stats = useMemo(() => computeCourseStats(responses), [responses]);

  // 테이블 필터링
  const filteredResponses = useMemo(() => {
    return responses.filter(r => {
      const matchCourse = selectedCourseFilter === '전체' || r.selectedCourses.includes(selectedCourseFilter);
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        r.id.toLowerCase().includes(q) ||
        r.selectedCourses.some(c => c.toLowerCase().includes(q));

      return matchCourse && matchSearch;
    });
  }, [responses, selectedCourseFilter, searchTerm]);

  // 상위 과목 리스트 (필터용 목록)
  const allDistinctCourses = useMemo(() => {
    const set = new Set<string>();
    responses.forEach(r => r.selectedCourses.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [responses]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 네비게이션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              교직원 관리자 전용
            </span>
            <span className="text-xs text-slate-400">
              효성고등학교 2027학년도 온라인 공동교육과정
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            희망과정 수요 조사 통계 결과
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToCSV(responses)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Excel에서 열 수 있는 CSV 파일로 다운로드합니다"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀 다운로드 (CSV)</span>
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>비밀번호 변경</span>
          </button>

          <button
            onClick={onBackToSurvey}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>설문 화면 보기</span>
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 요약 KPI 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">총 응답 건수</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalResponses}</span>
            <span className="text-xs text-slate-500">건</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            실시간 누적 집계
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">누적 과목 선택 수</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-600">{stats.totalCourseVotes}</span>
            <span className="text-xs text-slate-500">표</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            응답당 평균 {(stats.totalResponses > 0 ? (stats.totalCourseVotes / stats.totalResponses).toFixed(1) : 0)}개 과목 선택
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">최다 희망 과목</span>
          <div className="mt-2 truncate">
            <span className="text-base sm:text-lg font-bold text-slate-900 truncate block">
              {stats.topCourses[0] ? stats.topCourses[0].name : '-'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.topCourses[0] ? `${stats.topCourses[0].count}표 (${stats.topCourses[0].percentage}%)` : '응답 없음'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">수요 집중 교과군</span>
          <div className="mt-2 truncate">
            <span className="text-base sm:text-lg font-bold text-slate-900 truncate block">
              {stats.categoryStats[0] ? stats.categoryStats[0].category : '-'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.categoryStats[0] ? `전체 표의 ${stats.categoryStats[0].percentage}%` : '집계 대기'}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 & 빠른 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ranking'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 과목별 수요 랭킹
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 제출 응답 목록 ({filteredResponses.length}건)
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏛 교과군별 신청 분포
          </button>
        </div>

        <div className="flex items-center gap-2">
          {responses.length === 0 && (
            <button
              onClick={handleGenerateSamples}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>샘플 데이터 15건 추가</span>
            </button>
          )}

          {responses.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 text-xs px-2 py-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 데이터 초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* 탭 1: 과목별 수요 랭킹 (차트 & 테이블) */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  개설 희망 과목 수요 순위 (Top 20)
                </h3>
                <p className="text-xs text-slate-500">
                  통상 4~5명 이상 희망 시 공동교육과정 개설 심의 권장 기준이 충족됩니다.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                총 {stats.topCourses.length}개 과목 투표됨
              </span>
            </div>

            {stats.topCourses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">아직 접수된 설문 응답이 없습니다.</p>
                <button
                  onClick={handleGenerateSamples}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  시연용 샘플 데이터 채우기
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {stats.topCourses.slice(0, 20).map((course, idx) => {
                  const isTop3 = idx < 3;
                  const qualifiesForOpening = course.count >= 4;

                  return (
                    <div key={course.name} className="group">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                              isTop3
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{course.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {course.category}
                          </span>
                          {qualifiesForOpening && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              개설 권장 충족
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">전체 응답의 {course.percentage}%</span>
                          <span className="font-extrabold text-slate-900 text-sm w-12 text-right">
                            {course.count}표
                          </span>
                        </div>
                      </div>

                      {/* 프로그레스 바 */}
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop3
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              : qualifiesForOpening
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                          style={{
                            width: `${Math.max(4, (course.count / (stats.topCourses[0]?.count || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 탭 2: 응답 목록 테이블 */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* 필터 및 검색 바 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="응답 번호 또는 과목명 검색..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCourseFilter}
                onChange={e => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="전체">특정 과목 필터: 전체</option>
                {allDistinctCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 명부 테이블 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">연번</th>
                    <th className="px-4 py-3">응답 ID</th>
                    <th className="px-4 py-3">제출 일시</th>
                    <th className="px-4 py-3">선택 과목 수</th>
                    <th className="px-4 py-3">선택한 희망 과목 목록</th>
                    <th className="px-4 py-3 text-right">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredResponses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        일치하는 응답 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredResponses.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {r.id}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(r.submittedAt).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-700 whitespace-nowrap">
                          {r.selectedCourses.length}개 과목
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xl">
                            {r.selectedCourses.map(course => (
                              <span
                                key={course}
                                className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-[11px] font-medium"
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="응답 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 교과군별 신청 분포 */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">
            교과군별 개설 희망 수요 비중
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            각 교과군(수학, 과학, 외국어, 예술 등)에 접수된 전체 투표수 기준 분포입니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.categoryStats.map(cat => (
              <div key={cat.category} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-sm">{cat.category}</span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {cat.count}표 ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              관리자 비밀번호 변경
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              새로 사용할 관리자 접속 비밀번호를 입력해 주세요.
            </p>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {passwordChangeSuccess && (
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  비밀번호가 성공적으로 변경되었습니다!
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  변경 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
