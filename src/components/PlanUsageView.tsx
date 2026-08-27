import React, { useState } from 'react';
import {
  Check,
  Zap,
  TrendingUp,
  CreditCard,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Lock,
  Tag
} from 'lucide-react';

interface PlanUsageViewProps {
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PlanUsageView: React.FC<PlanUsageViewProps> = ({ addToast }) => {
  const [billingPeriod, setBillingPeriod] = useState<'annual' | 'monthly'>('annual');

  const plans = [
    {
      name: 'Starter Anual',
      leads: '10,000 leads / mes',
      monthlyPrice: '$29',
      annualPrice: '$23',
      annualBilled: '$276 / año facturado en Polar.sh',
      description: 'Para profesionales independientes y prospección inicial con clave Polar.',
      features: [
        '10,000 créditos mensuales',
        'Filtro por 240+ países y ciudades',
        'Extracción de email y teléfono',
        'Exportación a Excel y CSV',
        '1 dispositivo de hardware'
      ],
      current: false,
      polarLink: 'https://polar.sh/codemorf/products/leads-starter-annual'
    },
    {
      name: 'Pro Anual',
      leads: '35,000 leads / mes',
      monthlyPrice: '$79',
      annualPrice: '$59',
      annualBilled: '$708 / año facturado en Polar.sh',
      badge: 'POPULAR • RECOMENDADO',
      description: 'Para agencias y equipos comerciales de alto rendimiento.',
      features: [
        '35,000 créditos mensuales',
        'Verificador de Email & registros MX',
        'Detector de WhatsApp y Redes Sociales',
        'Morf AI Studio con soporte OpenAI / Gemini',
        'Búsquedas Programadas automáticas',
        '2 dispositivos de hardware simultáneos',
        'Motor multi-hilo 16 CPU'
      ],
      current: true,
      polarLink: 'https://polar.sh/codemorf/products/leads-pro-annual'
    },
    {
      name: 'Business Anual',
      leads: '150,000 leads / mes',
      monthlyPrice: '$199',
      annualPrice: '$149',
      annualBilled: '$1,788 / año facturado en Polar.sh',
      description: 'Para empresas con alta demanda de captación masiva continua.',
      features: [
        '150,000 créditos mensuales',
        'Verificación SMTP en tiempo real',
        'Filtro avanzado anti-duplicados',
        'Soporte completo de Proxies Residenciales',
        'Morf AI Copilot sin restricciones',
        '5 dispositivos simultáneos',
        '32 hilos concurrentes'
      ],
      current: false,
      polarLink: 'https://polar.sh/codemorf/products/leads-business-annual'
    },
    {
      name: 'Unlimited Enterprise',
      leads: 'Extracción Ilimitada',
      monthlyPrice: '$399',
      annualPrice: '$299',
      annualBilled: '$3,588 / año facturado en Polar.sh',
      description: 'Extracción sin límites para equipos enterprise y centros de datos.',
      features: [
        'Créditos 100% Ilimitados',
        'Túneles Proxy dedicados y SOCKS5',
        'API custom y webhooks webhook-to-CRM',
        'Dispositivos y asientos ilimitados',
        'SLA garantizado y soporte prioritario'
      ],
      current: false,
      polarLink: 'https://polar.sh/codemorf/products/leads-enterprise-annual'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              Polar.sh Merchant of Record
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Descuento Anual 25%
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Planes & Licencias Anuales Polar.sh
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitorea el uso de créditos y gestiona tu suscripción anual protegida por la pasarela global de Polar.sh.
          </p>
        </div>

        {/* Annual / Monthly switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto border border-slate-300">
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              billingPeriod === 'annual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Facturación Anual</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#F04438] text-white rounded-md font-extrabold">
              -25%
            </span>
          </button>

          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingPeriod === 'monthly'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {/* Usage Meter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#F04438] uppercase tracking-wider">
                Plan Activo: CodeMorf Leads PRO Anual
              </span>
              <span className="text-xs px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                Polar Verified
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Consumo de créditos del ciclo</h2>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-black text-slate-900">18,420</span>
            <span className="text-slate-400 font-mono text-sm"> / 35,000 leads</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[#F04438] to-[#FC8181] rounded-full transition-all"
              style={{ width: '52%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>52% utilizado (16,580 disponibles)</span>
            <span>Renovación anual: 26 de septiembre de 2026</span>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Planes y Licencias con Checkout Polar.sh
          </h2>
          <a
            href="https://polar.sh/docs/introduction"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
          >
            <span>Ver documentación Polar</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const priceDisplay = billingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            
            return (
              <div
                key={plan.name}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${
                  plan.current
                    ? 'bg-[#15171A] text-white border-slate-800 shadow-xl ring-2 ring-[#F04438]'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#F04438] text-white text-[10px] font-extrabold uppercase rounded-full shadow-sm tracking-wider whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className={`font-black text-lg ${plan.current ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <div className="font-mono text-xs font-bold text-[#F04438] mt-0.5">{plan.leads}</div>
                    <p className={`text-xs mt-2 ${plan.current ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline space-x-1">
                      <span className={`text-3xl font-black font-mono ${plan.current ? 'text-white' : 'text-slate-900'}`}>
                        {priceDisplay}
                      </span>
                      <span className={`text-xs ${plan.current ? 'text-slate-400' : 'text-slate-500'}`}>
                        /mes
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <div className="text-[10px] text-emerald-500 font-mono mt-0.5">
                        {plan.annualBilled}
                      </div>
                    )}
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
                    <div className="w-full py-2.5 bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 rounded-xl text-center text-xs font-bold font-mono">
                      ✓ Licencia Anual Activa
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        addToast(
                          'Checkout Polar.sh',
                          `Abriendo pasarela de pago Polar para ${plan.name} (${billingPeriod === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'})...`,
                          'info'
                        );
                      }}
                      className="w-full py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Suscribirse vía Polar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Polar Security & Guarantee footer note */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            Todas las licencias anuales se tramitan y respaldan a través de <strong>Polar.sh</strong> (Merchant of Record). Cumplimiento con impuestos internacionales y factura con IVA deducible.
          </span>
        </div>
        <a
          href="https://polar.sh/purchases"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-700 hover:underline font-bold whitespace-nowrap flex items-center space-x-1"
        >
          <span>Acceder a Mis Compras en Polar</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

