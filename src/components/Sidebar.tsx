import React from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  History,
  Bookmark,
  CheckCircle,
  Copy,
  Download,
  Bot,
  Key,
  CreditCard,
  Settings,
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { ActiveView, PolarBillingState } from '../types';
import type { CentralLicenseValidation } from '../services/billingService';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  resultsCount: number;
  openExportModal: () => void;
  billingState: PolarBillingState | null;
  centralLicense: CentralLicenseValidation | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  resultsCount,
  openExportModal,
  billingState,
  centralLicense
}) => {
  const navSections = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'new-search', label: 'Nueva búsqueda', icon: Search, badge: 'HOT', isHighlight: true },
        { id: 'results', label: 'Resultados', icon: Users, badge: resultsCount > 0 ? resultsCount.toLocaleString() : null },
        { id: 'history', label: 'Historial', icon: History, badge: null },
        { id: 'lists', label: 'Listas', icon: Bookmark, badge: null },
      ]
    },
    {
      title: 'HERRAMIENTAS',
      items: [
        { id: 'verifier', label: 'Verificador', icon: CheckCircle, badge: 'MX' },
        { id: 'duplicates', label: 'Duplicados', icon: Copy, badge: null },
        { id: 'exports', label: 'Exportaciones', icon: Download, badge: null, onClick: openExportModal },
        { id: 'morf-ai', label: 'Morf AI Studio', icon: Bot, badge: 'AI', isAi: true },
      ]
    },
    {
      title: 'CUENTA',
      items: [
        { id: 'license', label: 'Licencia', icon: Key, badge: null },
        { id: 'plan-usage', label: 'Plan y uso', icon: CreditCard, badge: null },
        { id: 'settings', label: 'Configuración', icon: Settings, badge: null },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#15171A] text-slate-300 flex flex-col justify-between border-r border-[#22262B] select-none h-[calc(100vh-2.5rem)]">
      {/* Scrollable Navigation */}
      <div className="py-4 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        setActiveView(item.id as ActiveView);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-[#F04438] text-white shadow-sm shadow-[#F04438]/20 font-semibold'
                        : item.isHighlight
                        ? 'text-slate-200 hover:bg-[#1E2227] hover:text-white'
                        : 'text-slate-400 hover:bg-[#1E2227] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'text-white'
                            : item.isAi
                            ? 'text-[#F04438]'
                            : item.isHighlight
                            ? 'text-amber-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          isActive
                            ? 'bg-black/25 text-white'
                            : item.isAi
                            ? 'bg-red-950/60 text-[#F04438] border border-red-800/40'
                            : item.isHighlight
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'bg-[#22262B] text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Plan & Quota Card */}
      <div className="p-3 border-t border-[#22262B] bg-[#121417]">
        <div className="p-3 rounded-lg bg-[#1A1D21] border border-[#2B3037] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-[#F04438]" />
              <span className="text-xs font-bold text-slate-100 tracking-wide">MorfEmail</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
              {centralLicense?.valid || billingState?.status === 'active' || billingState?.status === 'trialing' ? 'Activo' : 'Sin plan'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
                <span>Plan</span>
                <span className="text-slate-200 truncate max-w-[8rem]">{centralLicense?.valid ? (centralLicense.serviceName || centralLicense.plan || 'MorfEmail') : billingState?.planName || 'Sin plan activo'}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-300 pt-0.5">
                <span>Licencia</span>
                <span>{centralLicense?.valid || billingState?.status === 'active' || billingState?.status === 'trialing' ? 'Activa' : 'Pendiente'}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveView('plan-usage')}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[#262B32] hover:bg-[#F04438] text-slate-200 hover:text-white rounded-md text-xs font-medium transition-all group"
          >
            <span>Ver planes</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
};
