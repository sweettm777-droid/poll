import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Search, 
  AlertCircle, 
  X, 
  Sparkles,
  School,
  HelpCircle,
  ArrowRight,
  Check
} from 'lucide-react';
import { COURSE_CATEGORIES, CourseCategory, COURSES } from '../data/courses';
import { TrackType } from '../types/survey';
import { submitSurvey } from '../utils/storage';

interface StudentSurveyProps {
  onSurveySubmitted?: () => void;
  onOpenAdmin: () => void;
}

export const StudentSurvey: React.FC<StudentSurveyProps> = ({ onSurveySubmitted, onOpenAdmin }) => {
  // 과목 선택 상태
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('수학');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<'전체' | TrackType>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // UI 상태
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedCourses, setSubmittedCourses] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 카테고리별 과목 및 검색 필터링
  const filteredCourses = useMemo(() => {
    let list = COURSES;

    // 검색어가 있으면 카테고리 무관 전체 검색
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) ||
        (c.group && c.group.toLowerCase().includes(q))
      );
    }

    // 검색어가 없으면 선택된 카테고리 필터
    list = list.filter(c => c.category === activeCategory);

    // 유형 필터
    if (selectedTrackFilter !== '전체') {
      list = list.filter(c => c.trackType === selectedTrackFilter);
    }

    return list;
  }, [activeCategory, selectedTrackFilter, searchQuery]);

  // 카테고리별 등록된 과목 개수 계산
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    COURSES.forEach(c => {
      map[c.category] = (map[c.category] || 0) + 1;
    });
    return map;
  }, []);

  // 과목 선택/해제 토글
  const toggleCourse = (courseName: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseName)) {
        return prev.filter(c => c !== courseName);
      } else {
        return [...prev, courseName];
      }
    });
    setValidationError(null);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCourses.length === 0) {
      setValidationError('최소 1개 이상의 개설 희망 과목을 선택해 주세요.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      // 클라우드 데이터베이스에 실시간 저장
      await submitSurvey(selectedCourses);

      setSubmittedCourses([...selectedCourses]);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (onSurveySubmitted) {
        onSurveySubmitted();
      }
    } catch (err) {
      console.error(err);
      setValidationError('설문 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCourses([]);
    setValidationError(null);
    setIsSubmitted(false);
    setSubmittedCourses([]);
  };

  // 제출 완료 화면
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-center p-8 sm:p-12">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
            수요 조사가 제출되었습니다!
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            효성고등학교 온라인 공동교육과정 개설 희망 과목 수요조사에 응답해 주셔서 대단히 감사합니다.
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 text-left max-w-md mx-auto mb-8 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                제출한 희망 과목
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                총 {submittedCourses.length}개 과목
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {submittedCourses.map(course => (
                <span
                  key={course}
                  className="inline-flex items-center text-xs px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 rounded-lg font-medium shadow-2xs"
                >
                  <Check className="w-3 h-3 text-indigo-500 mr-1" />
                  {course}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md transition-colors text-sm"
            >
              추가 응답 작성하기
            </button>
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors text-sm"
            >
              선생님/관리자 모드로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-12">
      {/* 설문지 헤더 카드 */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden mb-4 sm:mb-6">
        <div className="h-2.5 sm:h-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600"></div>
        <div className="p-4 sm:p-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] sm:text-xs font-bold mb-3 sm:mb-4 tracking-wide">
            <School className="w-3.5 h-3.5 flex-shrink-0" />
            <span>효성고등학교</span>
          </div>

          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3 sm:mb-4 break-keep">
            효성고등학교 2027학년도 1학기 온라인 공동교육과정 개설 희망과정 수요 조사
          </h1>

          {/* 필수 안내 사항 강조 배너 */}
          <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-2.5 sm:gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed break-keep">
              <strong className="font-extrabold text-amber-900 block mb-0.5 text-xs sm:text-base">
                [필독] 설문 참여 시 필수 유의사항
              </strong>
              <span>
                이 설문은 <strong>교내 수요조사용</strong> 입니다. <strong>교육청용 설문(QR설문)은 반드시 따로 한번 더 하셔야 합니다.</strong>
              </span>
            </div>
          </div>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 break-keep">
            교과군을 선택하거나 검색하여 개설을 희망하는 과목을 자유롭게 복수 선택해 주세요.
            (별도의 인적사항 입력 없이 즉시 참여할 수 있습니다.)
          </p>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 pt-2.5 sm:pt-3 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded-md">
              ✓ 교과군별 객관식
            </span>
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded-md">
              ✓ 복수 선택 가능
            </span>
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded-md">
              ✓ 실시간 검색
            </span>
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded-md">
              ✓ 익명 참여
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* 오류 안내 배너 */}
        {validationError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 sm:p-4 flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm animate-shake">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-rose-600" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        {/* 교과군 및 세부과목 선택 섹션 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 break-keep">
                개설 희망 과목 선택 <span className="text-indigo-600 text-xs sm:text-sm">(복수 선택 가능)</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 break-keep mt-0.5">
                교과군을 누르거나 검색창에 과목명을 입력하여 선택해 주세요.
              </p>
            </div>

            {/* 현재 선택된 과목 수 표시 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-700 self-start sm:self-center">
              <span>선택된 과목:</span>
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                {selectedCourses.length}개
              </span>
            </div>
          </div>

          {/* 내가 선택한 과목 칩 리스트 */}
          {selectedCourses.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <span>내가 선택한 희망 과목 ({selectedCourses.length}개)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCourses([])}
                  className="text-[11px] sm:text-xs text-slate-500 hover:text-rose-600 underline font-medium"
                >
                  전체 취소
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {selectedCourses.map(courseName => (
                  <span
                    key={courseName}
                    className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white text-indigo-800 border border-indigo-200 text-xs font-medium rounded-lg shadow-2xs group hover:border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <span className="break-keep">{courseName}</span>
                    <button
                      type="button"
                      onClick={() => toggleCourse(courseName)}
                      className="text-slate-400 group-hover:text-rose-600 hover:bg-rose-100 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 검색 및 유형 필터 */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="과목명 검색 (예: 인공지능, 고급 물리학, 연극, 프랑스어)"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 유형별 탭 필터 (가로 스크롤 가능) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium text-slate-600 scrollbar-none">
              {(activeCategory === '교양' 
                ? (['전체', '진로선택', '융합선택', '일반선택'] as const)
                : (['전체', '진로선택', '융합선택', '전문·심화'] as const)
              ).map(track => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setSelectedTrackFilter(track as any)}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                    selectedTrackFilter === track
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>

          {/* 교과군 선택 버튼 그리드 (모바일 2열, PC 5열) */}
          {!searchQuery && (
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                교과군 (선택하여 하위 과목 보기)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {COURSE_CATEGORIES.map(category => {
                  const isActive = activeCategory === category;
                  const count = categoryCounts[category] || 0;
                  const selectedInCat = COURSES.filter(
                    c => c.category === category && selectedCourses.includes(c.name)
                  ).length;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setSelectedTrackFilter('전체');
                      }}
                      className={`relative p-2.5 sm:p-3 rounded-xl text-left border transition-all flex flex-col justify-between active:scale-[0.98] ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs sm:text-sm font-bold break-keep ${isActive ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`}>
                          {category}
                        </span>
                        {selectedInCat > 0 && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {selectedInCat}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
                        {count}과목
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 세부 과목 체크박스 리스트 */}
          <div className="border border-slate-200 rounded-xl p-3 sm:p-5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200 gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
                {searchQuery ? (
                  <span className="truncate">
                    검색 결과: <strong className="text-indigo-600">"{searchQuery}"</strong> ({filteredCourses.length})
                  </span>
                ) : (
                  <span className="truncate">
                    {activeCategory} ({filteredCourses.length}개)
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                터치하여 체크
              </span>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <HelpCircle className="w-7 h-7 mx-auto mb-1.5 opacity-60" />
                <p className="text-xs sm:text-sm">조건에 맞는 과목이 없습니다.</p>
                <p className="text-[11px] mt-0.5">검색어를 지우거나 필터를 변경해 보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5 max-h-[460px] overflow-y-auto pr-0.5">
                {filteredCourses.map(course => {
                  const isSelected = selectedCourses.includes(course.name);

                  let trackBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (course.trackType === '진로선택') {
                    trackBadge = 'bg-sky-50 text-sky-700 border-sky-200';
                  } else if (course.trackType === '융합선택') {
                    trackBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (course.trackType === '전문·심화') {
                    trackBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                  }

                  return (
                    <div
                      key={course.id}
                      onClick={() => toggleCourse(course.name)}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border text-left transition-all select-none flex items-start gap-2.5 min-h-[56px] active:scale-[0.99] ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/30 shadow-xs'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/90'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${trackBadge}`}>
                            {course.trackType}
                          </span>
                          {course.group && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {course.group}
                            </span>
                          )}
                          {searchQuery && (
                            <span className="text-[10px] text-indigo-600 font-medium">
                              [{course.category}]
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs sm:text-sm font-semibold break-keep leading-snug ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                          {course.name}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 데스크톱/태블릿용 기본 제출 버튼 */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-80 py-3.5 sm:py-4 px-6 sm:px-8 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer ${
              isSubmitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 hover:shadow-indigo-500/25'
            }`}
          >
            <span>
              {isSubmitting ? '서버에 제출 중...' : `희망 과목 제출하기 (${selectedCourses.length}개)`}
            </span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-2.5">
            제출된 응답은 공동교육과정 개설 심의 통계 자료로 활용됩니다.
          </p>
        </div>

        {/* 모바일 하단 Sticky 빠른 제출 바 (선택과목이 1개 이상일 때 하단 고정 노출) */}
        {selectedCourses.length > 0 && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-indigo-100 p-3 shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-500 block">선택한 희망 과목</span>
              <strong className="text-sm font-extrabold text-indigo-700 truncate block">
                총 {selectedCourses.length}개 과목
              </strong>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-2.5 px-5 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <span>{isSubmitting ? '제출 중...' : '제출하기'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
