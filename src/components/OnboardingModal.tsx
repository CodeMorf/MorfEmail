import React, { useState } from 'react';
import {
  Search,
  Users,
  Download,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  Bot
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      step: '1',
      title: 'Encuentra nuevos clientes',
      subtitle: 'Busca empresas por país, ciudad y sector.',
      description: 'Accede a un catálogo de más de 5,000 categorías empresariales y filtra por localización geográfica exacta con cobertura global.',
      icon: Search,
      color: 'from-[#F04438] to-[#D92D20]'
    },
    {
      step: '2',
      title: 'Obtén contactos empresariales',
      subtitle: 'Organiza emails, teléfonos, webs y datos comerciales públicos.',
      description: 'El motor analiza directorios y sitios web en tiempo real, validando registros MX de correo y números de WhatsApp comerciales.',
      icon: Users,
      color: 'from-blue-600 to-indigo-700'
    },
    {
      step: '3',
      title: 'Exporta y comienza tu prospección',
      subtitle: 'Excel, CSV, JSON y tus herramientas comerciales favoritas.',
      description: 'Descarga bases de datos depuradas o utiliza el asistente integrado Morf AI para generar secuencias de correos y guiones en frío.',
      icon: Download,
      color: 'from-emerald-600 to-teal-700'
    }
  ];

  const current = slides[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 duration-150 text-center relative overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator pills */}
        <div className="flex justify-center items-center space-x-2 pt-2">
          {slides.map((s, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-8 bg-[#F04438]' : 'w-2 bg-slate-200'
              }`}
            ></div>
          ))}
        </div>

        {/* Big Illustration Badge */}
        <div className="py-2">
          <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-xl shadow-[#F04438]/20 text-white transform hover:scale-105 transition-transform`}>
            <Icon className="w-10 h-10" />
          </div>
        </div>

        {/* Texts */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F04438]">
            Paso {current.step} de 3
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm font-semibold text-slate-700">
            {current.subtitle}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto pt-1">
            {current.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col space-y-2">
          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-[#F04438]/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{step === slides.length - 1 ? 'Comenzar a buscar' : 'Siguiente'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {step < slides.length - 1 && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium py-1"
            >
              Saltar introducción
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
