"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 bg-white p-4 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export default function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const disparaiRef = useRef<HTMLDivElement>(null);
  const person1Ref = useRef<HTMLDivElement>(null);
  const person2Ref = useRef<HTMLDivElement>(null);
  const person3Ref = useRef<HTMLDivElement>(null);
  const person4Ref = useRef<HTMLDivElement>(null);
  const person5Ref = useRef<HTMLDivElement>(null);

  // Refs para a segunda parte (qualificação com IA)
  const containerRef2 = useRef<HTMLDivElement>(null);
  const leadResponseRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const meetingRef = useRef<HTMLDivElement>(null);
  const sellerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Como funciona o <span className="text-[#4bca59]">Disparai</span>
          </h2>
          <p className="text-lg text-gray-600">
            Disparo em massa com IA para qualificação automática de leads. Veja como transformamos uma mensagem em vendas qualificadas.
          </p>
        </div>

        <div
          className="relative flex h-[450px] w-full items-center justify-center overflow-hidden p-8"
          ref={containerRef}
        >
          <div className="flex size-full max-w-4xl flex-row items-stretch justify-between gap-6">
            {/* WhatsApp - Origem */}
            <div className="flex flex-col justify-center">
              <Circle ref={whatsappRef} className="border-[#25D366] bg-[#25D366] size-16">
                <WhatsAppIcon />
              </Circle>
              <p className="mt-2 text-center text-sm font-medium text-gray-700">WhatsApp</p>
            </div>

            {/* Disparai - Processamento */}
            <div className="flex flex-col justify-center">
              <Circle ref={disparaiRef} className="border-[#4bca59] bg-[#4bca59] size-16">
                <DisparaiIcon />
              </Circle>
              <p className="mt-2 text-center text-sm font-medium text-gray-700">Disparai</p>
            </div>

            {/* Pessoas - Destino */}
            <div className="flex flex-col justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <Circle ref={person1Ref} className="border-gray-300 bg-gray-100 size-12">
                  <PersonIcon />
                </Circle>
                <p className="text-xs text-center text-gray-600">Lead 1</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Circle ref={person2Ref} className="border-gray-300 bg-gray-100 size-12">
                  <PersonIcon />
                </Circle>
                <p className="text-xs text-center text-gray-600">Lead 2</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Circle ref={person3Ref} className="border-gray-300 bg-gray-100 size-12">
                  <PersonIcon />
                </Circle>
                <p className="text-xs text-center text-gray-600">Lead 3</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Circle ref={person4Ref} className="border-gray-300 bg-gray-100 size-12">
                  <PersonIcon />
                </Circle>
                <p className="text-xs text-center text-gray-600">Lead 4</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Circle ref={person5Ref} className="border-gray-300 bg-gray-100 size-12">
                  <PersonIcon />
                </Circle>
                <p className="text-xs text-center text-gray-600">Lead 5</p>
              </div>
            </div>
          </div>

          {/* Animated Beams */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={whatsappRef}
            toRef={disparaiRef}
            curvature={-30}
            duration={3}
            gradientStartColor="#25D366"
            gradientStopColor="#4bca59"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={disparaiRef}
            toRef={person1Ref}
            curvature={-20}
            duration={3}
            delay={0.5}
            gradientStartColor="#4bca59"
            gradientStopColor="#3b82f6"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={disparaiRef}
            toRef={person2Ref}
            curvature={-10}
            duration={3}
            delay={1}
            gradientStartColor="#4bca59"
            gradientStopColor="#8b5cf6"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={disparaiRef}
            toRef={person3Ref}
            curvature={0}
            duration={3}
            delay={1.5}
            gradientStartColor="#4bca59"
            gradientStopColor="#10b981"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={disparaiRef}
            toRef={person4Ref}
            curvature={10}
            duration={3}
            delay={2}
            gradientStartColor="#4bca59"
            gradientStopColor="#f59e0b"
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={disparaiRef}
            toRef={person5Ref}
            curvature={20}
            duration={3}
            delay={2.5}
            gradientStartColor="#4bca59"
            gradientStopColor="#ec4899"
          />
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 max-w-3xl mx-auto">
            <strong className="text-gray-900">Disparo em massa + IA para qualificação:</strong> O Disparai envia mensagens personalizadas para milhares de contatos simultaneamente. Quando os leads respondem, nossa IA entra em ação para qualificar, agendar reuniões e direcionar para o vendedor certo.
          </p>
        </div>
      </div>

      {/* Segunda parte - Qualificação com IA */}
      <div className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-4">
              Quando o lead responde, nossa <span className="text-[#4bca59]">IA entra em ação</span>
            </h3>
            <p className="text-lg text-gray-600">
              Qualificação automática, agendamento inteligente e direcionamento para o vendedor certo.
            </p>
          </div>

          <div
            className="relative flex h-[400px] w-full max-w-4xl mx-auto items-center justify-center overflow-hidden p-6"
            ref={containerRef2}
          >
            {/* Lead Responde */}
            <div className="absolute left-4 flex flex-col justify-center">
              <Circle ref={leadResponseRef} className="border-blue-500 bg-blue-100 size-16">
                <MessageIcon />
              </Circle>
              <p className="mt-2 text-center text-sm font-medium text-gray-700">Lead Responde</p>
            </div>

            {/* Disparai Central com IA Orbitando */}
            <div className="relative flex flex-col items-center justify-center">
              <Circle ref={aiRef} className="border-[#4bca59] bg-[#4bca59] size-16">
                <DisparaiIcon />
              </Circle>
              <p className="mt-2 text-center text-sm font-medium text-gray-700">IA Qualifica</p>
              
              {/* OpenAI e Gemini orbitando */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s' }}>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200">
                    <img 
                      src="https://img.icons8.com/ios/50/chatgpt.png" 
                      alt="OpenAI" 
                      className="w-6 h-6"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200">
                    <img 
                      src="https://img.icons8.com/fluency/48/gemini-ai.png" 
                      alt="Gemini" 
                      className="w-6 h-6"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Divisão para múltiplos vendedores */}
            <div className="absolute right-4 flex flex-col gap-4">
              {/* Agendamento */}
              <div className="flex flex-col items-center">
                <Circle ref={meetingRef} className="border-gray-300 bg-gray-100 size-14">
                  <GoogleCalendarIcon />
                </Circle>
                <p className="mt-2 text-center text-xs font-medium text-gray-700">Agenda Reunião</p>
              </div>

              {/* Vendedores múltiplos */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <Circle ref={sellerRef} className="border-gray-300 bg-gray-100 size-12">
                    <SellerIcon />
                  </Circle>
                  <Circle className="border-gray-300 bg-gray-100 size-12">
                    <SellerIcon />
                  </Circle>
                  <Circle className="border-gray-300 bg-gray-100 size-12">
                    <SellerIcon />
                  </Circle>
                </div>
                <p className="mt-1 text-center text-xs font-medium text-gray-700">Vendedores</p>
              </div>
            </div>

            {/* Animated Beams para segunda parte */}
            <AnimatedBeam
              containerRef={containerRef2}
              fromRef={leadResponseRef}
              toRef={aiRef}
              curvature={-20}
              duration={2.5}
              delay={0}
              gradientStartColor="#3b82f6"
              gradientStopColor="#4bca59"
            />
            <AnimatedBeam
              containerRef={containerRef2}
              fromRef={aiRef}
              toRef={meetingRef}
              curvature={-25}
              duration={2.5}
              delay={1.2}
              gradientStartColor="#4bca59"
              gradientStopColor="#6b7280"
            />
            <AnimatedBeam
              containerRef={containerRef2}
              fromRef={aiRef}
              toRef={sellerRef}
              curvature={25}
              duration={2.5}
              delay={1.5}
              gradientStartColor="#4bca59"
              gradientStopColor="#f59e0b"
            />
            <AnimatedBeam
              containerRef={containerRef2}
              fromRef={aiRef}
              toRef={sellerRef}
              curvature={30}
              duration={2.5}
              delay={1.7}
              gradientStartColor="#4bca59"
              gradientStopColor="#f59e0b"
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600 max-w-3xl mx-auto">
              <strong className="text-gray-900">Fluxo inteligente de qualificação:</strong> Nossa IA analisa as respostas, identifica o interesse do lead, agenda automaticamente reuniões e direciona para o vendedor mais adequado, maximizando as chances de conversão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ícones personalizados
const WhatsAppIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
      fill="white"
    />
  </svg>
);

const DisparaiIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      fill="white"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PersonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Novos ícones para a segunda parte
const MessageIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M13 8H7" />
    <path d="M17 12H7" />
  </svg>
);


// Ícone do Google Calendar
const GoogleCalendarIcon = () => (
  <img 
    src="https://img.icons8.com/color/48/google-calendar--v2.png" 
    alt="Google Calendar" 
    className="w-6 h-6"
  />
);

const SellerIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
