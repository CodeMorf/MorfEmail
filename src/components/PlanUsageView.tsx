import React from 'react';
import {
  Check,
  Zap,
  TrendingUp,
  CreditCard,
  Shield,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface PlanUsageViewProps {
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PlanUsageView: React.FC<PlanUsageViewProps> = ({ addToast }) => {
  const plans = [
    {
      name: 'Starter',
      leads: '5,000 leads / mes',
      price: '$29',
      period: '/mes',
      description: 'Para profesionales independientes y prospección inicial.',
      features: [
        '5,000 créditos de extracción',
        'Filtro por país y ciudad',
        'Extracción de email y teléfono',
        'Exportación a Excel y CSV',
        '1 dispositivo'
      ],
      current: false
    },
    {
      name: 'Pro',
      leads: '25,000 leads / mes',
      price: '$79',
      period: '/mes',
      badge: 'MOST POPULAR',
      description: 'Para agencias y equipos comerciales en crecimiento.',
      features: [
        '25,000 créditos de extracción',
        'Verificador de Email & registros MX',
        'Detector de WhatsApp comercial',
        'Morf AI Copilot incluido',
        '2 dispositivos simultáneos',
        'Prioridad en motor de 16 hilos'
      ],
      current: true
    },
    {
      name: 'Business',
      leads: '100,000 leads / mes',
      price: '$199',
      period: '/mes',
      description: 'Para empresas con alta demanda de captación continua.',
      features: [
        '100,000 créditos de extracción',
        'Verificación en tiempo real',
        'Filtro de duplicados avanzado',
        'Morf AI Studio ilimitado',
        '5 dispositivos simultáneos',
        '32 hilos concurrentes'
      ],
      current: false
    },
    {
      name: 'Unlimited',
      leads: 'Uso avanzado',
      price: '$399',
      period: '/mes',
      description: 'Extracción sin restricciones para centros de datos.',
      features: [
        'Créditos ilimitados',
        'Proxy rotativo residencial',
        'API personalizada',
        'Dispositivos ilimitados',
        'Soporte 24/7 con SLA dedicado'
      ],
      current: false
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 overflow-y-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plan y Consumo de Créditos</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitorea tu cuota mensual de extracción y actualiza tu capacidad cuando lo necesites.
        </p>
      </div>

      {/* Usage Meter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#F04438] uppercase tracking-wider">Plan Activo: PRO</span>
              <span className="text-xs px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">Al corriente</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Consumo del ciclo actual</h2>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-black text-slate-900">18,420</span>
            <span className="text-slate-400 font-mono text-sm"> / 25,000 leads</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[#F04438] to-[#FC8181] rounded-full transition-all"
              style={{ width: '74%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>74% utilizado (6,580 disponibles)</span>
            <span>Renovación programada: 26 de septiembre de 2026</span>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Planes Disponibles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${
                plan.current
                  ? 'bg-[#15171A] text-white border-slate-800 shadow-xl ring-2 ring-[#F04438]'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#F04438] text-white text-[10px] font-extrabold uppercase rounded-full shadow-sm tracking-wider">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className={`font-black text-lg ${plan.current ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <div className="font-mono text-xs font-bold text-[#F04438] mt-0.5">{plan.leads}</div>
                  <p className={`text-xs mt-2 ${plan.current ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="pt-2">
                  <span className={`text-3xl font-black font-mono ${plan.current ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-xs ${plan.current ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-slate-100/20 text-xs">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className={plan.current ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                {plan.current ? (
                  <div className="w-full py-2 bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 rounded-xl text-center text-xs font-bold font-mono">
                    ✓ Plan Actual
                  </div>
                ) : (
                  <button
                    onClick={() => addToast('Solicitud de cambio de plan', `Actualizando a ${plan.name}...`, 'info')}
                    className="w-full py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Seleccionar {plan.name}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
