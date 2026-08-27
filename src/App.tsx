import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { NewSearchView } from './components/NewSearchView';
import { SearchProgressView } from './components/SearchProgressView';
import { ResultsView } from './components/ResultsView';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { ExportModal } from './components/ExportModal';
import { HistoryView } from './components/HistoryView';
import { ListsView } from './components/ListsView';
import { EmailVerifierView } from './components/EmailVerifierView';
import { DuplicatesView } from './components/DuplicatesView';
import { MorfAiView } from './components/MorfAiView';
import { LicenseView } from './components/LicenseView';
import { PlanUsageView } from './components/PlanUsageView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { ToastContainer } from './components/Toast';

import { ActiveView, Lead, LeadList, SearchConfig, SearchHistoryItem, ToastMessage } from './types';
import { INITIAL_LEADS, INITIAL_HISTORY, INITIAL_LISTS, DEFAULT_SEARCH_CONFIG } from './data/mockData';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [history, setHistory] = useState<SearchHistoryItem[]>(INITIAL_HISTORY);
  const [lists, setLists] = useState<LeadList[]>(INITIAL_LISTS);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>(DEFAULT_SEARCH_CONFIG);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'ready' | 'scanning' | 'paused' | 'idle'>('ready');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = (
    title: string,
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcuts listener (Windows desktop feel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveView('new-search');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search Flow
  const handleStartSearch = () => {
    setEngineStatus('scanning');
    setActiveView('search-progress');
    addToast('Búsqueda iniciada', `Extrayendo leads para "${searchConfig.businessType}" en ${searchConfig.country}.`, 'info');
  };

  const handleSearchComplete = () => {
    setEngineStatus('ready');
    
    // Add to history
    const newHistoryItem: SearchHistoryItem = {
      id: `hist-${Date.now()}`,
      query: `${searchConfig.businessType} ${searchConfig.city || searchConfig.country}`,
      country: searchConfig.country,
      flag: searchConfig.flag,
      city: searchConfig.city || 'Nacional',
      category: searchConfig.businessType,
      leadsFound: 4192,
      exportedCount: 0,
      duration: '3m 42s',
      status: 'completed',
      date: 'Hoy (Ahora)',
      config: searchConfig
    };

    setHistory((prev) => [newHistoryItem, ...prev]);
    setActiveView('results');
    addToast('Extracción finalizada', '4,192 empresas agregadas a la vista de Resultados.', 'success');
  };

  const handleRepeatSearch = (item: SearchHistoryItem) => {
    setSearchConfig((prev) => ({
      ...prev,
      businessType: item.category,
      country: item.country,
      flag: item.flag,
      city: item.city
    }));
    setEngineStatus('scanning');
    setActiveView('search-progress');
    addToast('Repitiendo búsqueda', `Iniciando rastreo para ${item.query}...`, 'info');
  };

  const handleOpenResultsFor = (item: SearchHistoryItem) => {
    setActiveView('results');
    addToast('Resultados cargados', `Mostrando registros de ${item.query}.`, 'info');
  };

  // Lead actions
  const handleAddToList = (leadId: string, listId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, listId } : l))
    );

    const listName = lists.find((l) => l.id === listId)?.name || 'Lista';
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, leadCount: l.leadCount + 1 } : l
      )
    );

    addToast('Lead guardado', `Agregado a la lista "${listName}".`, 'success');
  };

  const handleAddToListBulk = (leadIds: string[], listId: string) => {
    setLeads((prev) =>
      prev.map((l) => (leadIds.includes(l.id) ? { ...l, listId } : l))
    );

    const listName = lists.find((l) => l.id === listId)?.name || 'Lista';
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, leadCount: l.leadCount + leadIds.length } : l
      )
    );

    addToast('Leads guardados en lote', `${leadIds.length} leads guardados en "${listName}".`, 'success');
  };

  const handleDeleteLeads = (leadIds: string[]) => {
    setLeads((prev) => prev.filter((l) => !leadIds.includes(l.id)));
  };

  // List management
  const handleCreateList = (name: string, description: string, color: string) => {
    const newList: LeadList = {
      id: `list-${Date.now()}`,
      name,
      icon: 'bookmark',
      color: color || '#F04438',
      description,
      leadCount: 0,
      updatedAt: 'Ahora'
    };
    setLists((prev) => [newList, ...prev]);
  };

  const handleDeleteList = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F6F7F9] text-slate-800 font-sans select-none overflow-hidden antialiased">
      {/* 1. Windows Graphite TitleBar */}
      <TitleBar
        activeView={activeView}
        setActiveView={setActiveView}
        engineStatus={engineStatus}
        onShowOnboarding={() => setIsOnboardingOpen(true)}
        addToast={addToast}
      />

      {/* 2. Main Desktop Layout: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Dark Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          resultsCount={leads.length}
          openExportModal={() => setIsExportModalOpen(true)}
        />

        {/* Center Main Work Area */}
        <main className="flex-1 bg-[#F6F7F9] overflow-y-auto relative custom-scrollbar">
          {activeView === 'dashboard' && (
            <DashboardView
              setActiveView={setActiveView}
              history={history}
              onRepeatSearch={handleRepeatSearch}
              onOpenResultsFor={handleOpenResultsFor}
              openExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {activeView === 'new-search' && (
            <NewSearchView
              config={searchConfig}
              setConfig={setSearchConfig}
              onStartSearch={handleStartSearch}
              openMorfAi={() => setActiveView('morf-ai')}
            />
          )}

          {activeView === 'search-progress' && (
            <SearchProgressView
              config={searchConfig}
              setActiveView={setActiveView}
              onSearchComplete={handleSearchComplete}
              addToast={addToast}
            />
          )}

          {activeView === 'results' && (
            <ResultsView
              leads={leads}
              onSelectLead={(lead) => setSelectedLead(lead)}
              openExportModal={() => setIsExportModalOpen(true)}
              lists={lists}
              onAddToListBulk={handleAddToListBulk}
              onDeleteLeads={handleDeleteLeads}
              addToast={addToast}
            />
          )}

          {activeView === 'history' && (
            <HistoryView
              history={history}
              onRepeatSearch={handleRepeatSearch}
              onOpenResultsFor={handleOpenResultsFor}
              onDeleteHistoryItem={handleDeleteHistory}
              openExportModal={() => setIsExportModalOpen(true)}
              addToast={addToast}
            />
          )}

          {activeView === 'lists' && (
            <ListsView
              lists={lists}
              leads={leads}
              onCreateList={handleCreateList}
              onDeleteList={handleDeleteList}
              onSelectLead={(lead) => setSelectedLead(lead)}
              openExportModal={() => setIsExportModalOpen(true)}
              setActiveView={setActiveView}
              addToast={addToast}
            />
          )}

          {activeView === 'verifier' && (
            <EmailVerifierView addToast={addToast} />
          )}

          {activeView === 'duplicates' && (
            <DuplicatesView leads={leads} addToast={addToast} />
          )}

          {activeView === 'morf-ai' && (
            <MorfAiView
              setActiveView={setActiveView}
              setConfig={setSearchConfig}
              addToast={addToast}
            />
          )}

          {activeView === 'license' && (
            <LicenseView setActiveView={setActiveView} addToast={addToast} />
          )}

          {activeView === 'plan-usage' && (
            <PlanUsageView addToast={addToast} />
          )}

          {activeView === 'settings' && (
            <SettingsView addToast={addToast} />
          )}
        </main>
      </div>

      {/* 3. Slide-over Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        lists={lists}
        onAddToList={handleAddToList}
        addToast={addToast}
      />

      {/* 4. Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        leads={leads}
        addToast={addToast}
      />

      {/* 5. First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* 6. Desktop Toast Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
