/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  School, 
  Lock, 
  FileEdit, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut,
  Info
} from 'lucide-react';
import { StudentSurvey } from './components/StudentSurvey';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'survey' | 'admin'>('survey');

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsLoginModalOpen(false);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('survey');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 상단 네비게이션 바 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 학교 로고 & 명칭 */}
          <div 
            onClick={() => setCurrentView('survey')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  효성고등학교
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  공동교육과정
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                2027학년도 1학기 온라인 공동교육과정 개설 희망과정 수요 조사
              </p>
            </div>
          </div>

          {/* 우측 탭 / 관리자 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('survey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'survey'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>설문 참여</span>
            </button>

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    currentView === 'admin'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>관리자 대시보드</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs"
                  title="관리자 로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 shadow-2xs transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>관리자 로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 뷰 컨텐츠 */}
      <main className="flex-1">
        {currentView === 'survey' ? (
          <StudentSurvey
            onOpenAdmin={() => {
              if (isAdminLoggedIn) {
                setCurrentView('admin');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
          />
        ) : (
          <AdminDashboard
            onBackToSurvey={() => setCurrentView('survey')}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 효성고등학교. 온라인 공동교육과정 수요조사 시스템.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isAdminLoggedIn) setCurrentView('admin');
                else setIsLoginModalOpen(true);
              }}
              className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>교직원 전용 결과 확인</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 관리자 로그인 모달 */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
