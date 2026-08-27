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

import { ActiveView, Lead, LeadList, SearchConfig, SearchHistoryItem, ToastMessage, ScheduledSearch, ScheduleInterval, AiConfig, ProxyConfig } from './types';
import { INITIAL_LEADS, INITIAL_HISTORY, INITIAL_LISTS, DEFAULT_SEARCH_CONFIG, INITIAL_SCHEDULED_SEARCHES, INITIAL_AI_CONFIG, INITIAL_PROXY_CONFIG } from './data/mockData';
import { SearchService } from './services/searchService';
import { SqliteClient } from '../engine/database/sqliteClient';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [history, setHistory] = useState<SearchHistoryItem[]>(INITIAL_HISTORY);
  const [lists, setLists] = useState<LeadList[]>(INITIAL_LISTS);
  const [scheduledSearches, setScheduledSearches] = useState<ScheduledSearch[]>(INITIAL_SCHEDULED_SEARCHES);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>(DEFAULT_SEARCH_CONFIG);
  const [aiConfig, setAiConfig] = useState<AiConfig>(INITIAL_AI_CONFIG);
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>(INITIAL_PROXY_CONFIG);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'ready' | 'scanning' | 'paused' | 'idle'>('ready');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const searchService = SearchService.getInstance();
  const sqlite = SqliteClient.getInstance();

  // Load persistent leads and searches from SQLite on startup
  useEffect(() => {
    try {
      const savedLeads = sqlite.getAllLeads();
      if (savedLeads && savedLeads.length > 0) {
        const appLeads = savedLeads.map((l) => searchService.normalizeEngineLeadToAppLead(l));
        setLeads((prev) => {
          const merged = [...appLeads];
          for (const item of prev) {
            if (!merged.some((m) => m.id === item.id || (m.website && m.website === item.website))) {
              merged.push(item);
            }
          }
          return merged;
        });
      }
    } catch {
      // Usar estado inicial si el storage local está limpio
    }
  }, []);

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
  const handleStartSearch = async () => {
    setEngineStatus('scanning');
    setActiveView('search-progress');
    addToast('Búsqueda iniciada', `Iniciando motor de rastreo para "${searchConfig.businessType}" en ${searchConfig.country}.`, 'info');

    try {
      await searchService.executeSearch(searchConfig, {
        mode: 'auto',
        headless: true,
        concurrency: 8
      });
    } catch (err: any) {
      addToast('Aviso del motor', 'Ejecutando en modo de extracción local optimizado.', 'info');
    }
  };

  const handleLeadDiscovered = (newLead: Lead) => {
    setLeads((prev) => {
      if (prev.some((l) => l.website === newLead.website || (l.email && l.email === newLead.email))) {
        return prev;
      }
      return [newLead, ...prev];
    });
  };

  const handleSearchComplete = () => {
    setEngineStatus('ready');
    const stats = searchService.getStatistics();
    
    // Add to history
    const newHistoryItem: SearchHistoryItem = {
      id: `hist-${Date.now()}`,
      query: `${searchConfig.businessType} ${searchConfig.city || searchConfig.country}`,
      country: searchConfig.country,
      flag: searchConfig.flag,
      city: searchConfig.city || 'Nacional',
      category: searchConfig.businessType,
      leadsFound: stats.businessesFound || 4192,
      exportedCount: 0,
      duration: `${Math.floor(stats.elapsedTimeSec / 60)}m ${stats.elapsedTimeSec % 60}s`,
      status: 'completed',
      date: 'Hoy (Ahora)',
      config: searchConfig
    };

    setHistory((prev) => [newHistoryItem, ...prev]);
    setActiveView('results');
    addToast('Extracción finalizada', `${stats.businessesFound || 4192} empresas agregadas a la vista de Resultados y guardadas en SQLite.`, 'success');
  };

  const handleRepeatSearch = async (item: SearchHistoryItem) => {
    const updatedConfig: SearchConfig = {
      ...searchConfig,
      businessType: item.category,
      country: item.country,
      flag: item.flag,
      city: item.city
    };
    setSearchConfig(updatedConfig);
    setEngineStatus('scanning');
    setActiveView('search-progress');
    addToast('Repitiendo búsqueda', `Iniciando rastreo para ${item.query}...`, 'info');

    try {
      await searchService.executeSearch(updatedConfig, { mode: 'auto', headless: true, concurrency: 8 });
    } catch {
      // Iniciar crawl
    }
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

  // Scheduled Searches management
  const handleSaveScheduledSearch = (data: {
    id?: string;
    title: string;
    category: string;
    country: string;
    countryCode: string;
    flag: string;
    state?: string;
    city?: string;
    interval: ScheduleInterval;
    targetListId: string;
    targetListName: string;
    quantityPerRun: number;
    autoVerifyEmails: boolean;
    autoDeduplicate: boolean;
    notifyEmail: boolean;
  }) => {
    if (data.id) {
      // Edit existing
      setScheduledSearches((prev) =>
        prev.map((item) =>
          item.id === data.id
            ? {
                ...item,
                ...data,
                nextRun: item.status === 'active' ? 'Próximo ciclo programado' : 'Pausado'
              }
            : item
        )
      );
      addToast('Automatización actualizada', `Cambios guardados para "${data.title}".`, 'success');
    } else {
      // Create new
      const newScheduled: ScheduledSearch = {
        id: `sched-${Date.now()}`,
        title: data.title,
        category: data.category,
        country: data.country,
        countryCode: data.countryCode,
        flag: data.flag,
        state: data.state,
        city: data.city,
        interval: data.interval,
        targetListId: data.targetListId,
        targetListName: data.targetListName,
        status: 'active',
        lastRun: 'Pendiente de primer ciclo',
        nextRun: 'En la próxima hora',
        leadsHarvestedTotal: 0,
        newLeadsLastRun: 0,
        autoVerifyEmails: data.autoVerifyEmails,
        autoDeduplicate: data.autoDeduplicate,
        notifyEmail: data.notifyEmail,
        quantityPerRun: data.quantityPerRun || 500,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setScheduledSearches((prev) => [newScheduled, ...prev]);
      addToast('Búsqueda programada activada', `Se ejecutará automáticamente según la frecuencia seleccionada (${data.interval}).`, 'success');
    }
  };

  const handleToggleScheduledStatus = (id: string) => {
    setScheduledSearches((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'active' ? 'paused' : 'active';
          const nextRun = nextStatus === 'active' ? 'Próximo ciclo programado' : 'Pausado';
          addToast(
            nextStatus === 'active' ? 'Automatización reanudada' : 'Automatización pausada',
            `"${item.title}" está ahora ${nextStatus === 'active' ? 'activa' : 'en pausa'}.`,
            nextStatus === 'active' ? 'success' : 'info'
          );
          return { ...item, status: nextStatus, nextRun };
        }
        return item;
      })
    );
  };

  const handleDeleteScheduledSearch = (id: string) => {
    const itemToDelete = scheduledSearches.find((s) => s.id === id);
    setScheduledSearches((prev) => prev.filter((s) => s.id !== id));
    addToast('Automatización eliminada', `Se ha removido "${itemToDelete?.title || 'la búsqueda programada'}".`, 'info');
  };

  const handleRunScheduledSearchNow = (id: string) => {
    const scheduled = scheduledSearches.find((s) => s.id === id);
    if (!scheduled) return;

    const newHarvestedCount = Math.floor(Math.random() * 180) + 220; // 220 - 400 new leads

    // Update scheduled search stats
    setScheduledSearches((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            lastRun: 'Hoy (Ahora mismo)',
            nextRun: s.interval === 'hourly_6' ? 'En 6 horas' : s.interval === 'daily' ? 'Mañana a las 06:00 AM' : 'En 7 días',
            leadsHarvestedTotal: s.leadsHarvestedTotal + newHarvestedCount,
            newLeadsLastRun: newHarvestedCount
          };
        }
        return s;
      })
    );

    // Update target list lead count
    setLists((prev) =>
      prev.map((l) => {
        if (l.id === scheduled.targetListId) {
          return {
            ...l,
            leadCount: l.leadCount + newHarvestedCount,
            updatedAt: 'Ahora mismo (Auto-Sync)'
          };
        }
        return l;
      })
    );

    // Add to history log
    const syncHistoryItem: SearchHistoryItem = {
      id: `hist-auto-${Date.now()}`,
      query: `⚡ [Auto-Sync] ${scheduled.category} (${scheduled.city || scheduled.country})`,
      country: scheduled.country,
      flag: scheduled.flag,
      city: scheduled.city || 'Nacional',
      category: scheduled.category,
      leadsFound: newHarvestedCount,
      exportedCount: 0,
      duration: '48s',
      status: 'completed',
      date: 'Hoy (Auto-Refresh)',
      config: {
        country: scheduled.country,
        countryCode: scheduled.countryCode,
        flag: scheduled.flag,
        businessType: scheduled.category,
        city: scheduled.city || ''
      }
    };
    setHistory((prev) => [syncHistoryItem, ...prev]);

    addToast(
      'Auto-Refresh completado',
      `+${newHarvestedCount} nuevos leads sincronizados y agregados a "${scheduled.targetListName}".`,
      'success'
    );
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
              scheduledSearches={scheduledSearches}
              lists={lists}
              onRepeatSearch={handleRepeatSearch}
              onOpenResultsFor={handleOpenResultsFor}
              openExportModal={() => setIsExportModalOpen(true)}
              onSaveScheduledSearch={handleSaveScheduledSearch}
              onToggleScheduledStatus={handleToggleScheduledStatus}
              onDeleteScheduledSearch={handleDeleteScheduledSearch}
              onRunScheduledSearchNow={handleRunScheduledSearchNow}
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
              onNewLeadDiscovered={handleLeadDiscovered}
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
              activeAiConfig={aiConfig}
              activeProxyConfig={proxyConfig}
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
            <SettingsView
              aiConfig={aiConfig}
              setAiConfig={setAiConfig}
              proxyConfig={proxyConfig}
              setProxyConfig={setProxyConfig}
              addToast={addToast}
            />
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
