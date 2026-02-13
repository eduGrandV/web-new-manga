'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Sprout, ChevronRight, Users, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { locaPlanta } from '@/src/data/dados';
import { getSessoes } from '@/src/services/api';

interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador: string;
  criadoEm: string;
  relatorios: any[];
}

interface GrupoPorData {
  dataIso: string; // YYYY-MM-DD para ordenação
  dataFormatada: string;
  totalPlantas: number;
  avaliadores: string[];
  alertasCriticos: number; 
  sessoes: Sessao[];
}

export default function LocalHistoryPage() {
  const params = useParams();
  const router = useRouter();
  
  const centroCustoParam = decodeURIComponent(params.centroCusto as string);
  
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<GrupoPorData[]>([]);
  
  const infoLocal = locaPlanta.find(l => l.centroCusto === centroCustoParam);
  const nomeLocal = infoLocal ? infoLocal.name : `Local CC: ${centroCustoParam}`;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const todosDados: Sessao[] = await getSessoes();
      
      const dadosDoLocal = todosDados.filter(d => d.centroCusto === centroCustoParam);

      const agrupado: Record<string, Sessao[]> = {};
      
      dadosDoLocal.forEach(sessao => {
        const dia = sessao.criadoEm.split('T')[0]; 
        if (!agrupado[dia]) agrupado[dia] = [];
        agrupado[dia].push(sessao);
      });

      const listaGrupos: GrupoPorData[] = Object.keys(agrupado).map(dia => {
        const sessoesDoDia = agrupado[dia];
        
        const countCriticos = sessoesDoDia.filter(s => 
          s.relatorios.some((r: any) => r.porcentagem > 5)
        ).length;

        const nomesUnicos = Array.from(new Set(sessoesDoDia.map(s => s.nomeAvaliador || "Desconhecido")));

        return {
          dataIso: dia,
          dataFormatada: format(parseISO(dia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          totalPlantas: sessoesDoDia.length,
          avaliadores: nomesUnicos,
          alertasCriticos: countCriticos,
          sessoes: sessoesDoDia
        };
      });

      listaGrupos.sort((a, b) => b.dataIso.localeCompare(a.dataIso));

      setGrupos(listaGrupos);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <button 
            onClick={() => router.back()} 
            className="text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{nomeLocal}</h1>
            <p className="text-gray-600 mt-1">Histórico de Monitoramento</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-700 font-medium">Carregando histórico...</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-16 bg-linear-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-gray-400" size={28} />
              </div>
              <h3 className="text-gray-900 font-semibold text-xl mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-gray-600">
                Não há histórico de monitoramento para este local
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grupos.map((grupo) => (
              <div 
                key={grupo.dataIso}
                onClick={() => router.push(`/local/${encodeURIComponent(centroCustoParam)}/${grupo.dataIso}`)}
                className="group bg-white rounded-xl border border-gray-200 p-5 cursor-pointer transition-all duration-300 hover:border-emerald-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <Calendar size={20} className="text-emerald-700" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">
                      {format(parseISO(grupo.dataIso), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <ChevronRight 
                    size={20} 
                    className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" 
                  />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-1.5 rounded">
                      <Sprout size={16} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {grupo.totalPlantas} {grupo.totalPlantas === 1 ? 'planta avaliada' : 'plantas avaliadas'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-1.5 rounded">
                      <Users size={16} className="text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium truncate">
                      {grupo.avaliadores.length === 1 ? '1 avaliador' : `${grupo.avaliadores.length} avaliadores`}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  {grupo.alertasCriticos > 0 ? (
                    <div className="inline-flex items-center gap-2 bg-linear-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
                      <div className="bg-red-100 p-1 rounded">
                        <AlertTriangle size={14} className="text-red-600" />
                      </div>
                      <span className="font-semibold text-sm">
                        {grupo.alertasCriticos} {grupo.alertasCriticos === 1 ? 'alerta crítico' : 'alertas críticos'}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-linear-to-r from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg">
                      <div className="bg-emerald-100 p-1 rounded">
                        <CheckCircle size={14} className="text-emerald-600" />
                      </div>
                      <span className="font-semibold text-sm">
                        Área em condições normais
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}