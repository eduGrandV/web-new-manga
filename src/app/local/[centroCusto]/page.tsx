'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Sprout, ChevronRight, Users, 
  AlertTriangle, CheckCircle, FileText, BarChart3, Search 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { locaPlanta } from '@/src/data/dados';
import { getSessoes } from '@/src/services/api';

// --- Interfaces Tipadas ---
interface Relatorio {
  porcentagem: number;
  [key: string]: any; // Flexibilidade para outros campos
}

interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador: string;
  criadoEm: string;
  relatorios: Relatorio[];
}

interface GrupoPorData {
  dataIso: string;
  dataFormatada: string;
  totalPlantas: number;
  avaliadores: string[];
  alertasCriticos: number; 
  sessoes: Sessao[];
}

// --- Componente de Loading (Skeleton) ---
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-48">
        <div className="flex justify-between mb-4">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-6 h-10 w-full bg-gray-100 rounded"></div>
      </div>
    ))}
  </div>
);

export default function LocalHistoryPage() {
  const params = useParams();
  const router = useRouter();
  
  const centroCustoParam = decodeURIComponent(params.centroCusto as string);
  
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<GrupoPorData[]>([]);
  const [filtro, setFiltro] = useState('');

  const infoLocal = locaPlanta.find(l => l.centroCusto === centroCustoParam);
  const nomeLocal = infoLocal ? infoLocal.name : `Local CC: ${centroCustoParam}`;

  // --- Lógica de Busca ---
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const todosDados: Sessao[] = await getSessoes();
      
      // Filtragem inicial pelo local
      const dadosDoLocal = todosDados.filter(d => d.centroCusto === centroCustoParam);

      // Agrupamento
      const agrupado: Record<string, Sessao[]> = {};
      
      dadosDoLocal.forEach(sessao => {
        const dia = sessao.criadoEm.split('T')[0]; 
        if (!agrupado[dia]) agrupado[dia] = [];
        agrupado[dia].push(sessao);
      });

      const listaGrupos: GrupoPorData[] = Object.keys(agrupado).map(dia => {
        const sessoesDoDia = agrupado[dia];
        
        const countCriticos = sessoesDoDia.filter(s => 
          s.relatorios?.some((r) => r.porcentagem > 5)
        ).length;

        const nomesUnicos = Array.from(new Set(sessoesDoDia.map(s => s.nomeAvaliador || "Desconhecido")));

        return {
          dataIso: dia,
          dataFormatada: format(parseISO(dia), "dd 'de' MMM, yyyy", { locale: ptBR }),
          totalPlantas: sessoesDoDia.length,
          avaliadores: nomesUnicos,
          alertasCriticos: countCriticos,
          sessoes: sessoesDoDia
        };
      });

      // Ordenação decrescente (mais recente primeiro)
      listaGrupos.sort((a, b) => b.dataIso.localeCompare(a.dataIso));

      setGrupos(listaGrupos);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    } finally {
      setLoading(false);
    }
  }, [centroCustoParam]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // --- Filtro (Opcional) ---
  const gruposFiltrados = useMemo(() => {
    return grupos.filter(g => 
      g.dataFormatada.toLowerCase().includes(filtro.toLowerCase()) ||
      g.avaliadores.some(a => a.toLowerCase().includes(filtro.toLowerCase()))
    );
  }, [grupos, filtro]);

  // --- Estatísticas Gerais ---
  const stats = useMemo(() => {
    const totalVisitas = grupos.length;
    const totalAlertas = grupos.reduce((acc, curr) => acc + curr.alertasCriticos, 0);
    return { totalVisitas, totalAlertas };
  }, [grupos]);

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho Melhorado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 p-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{nomeLocal}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-mono text-gray-700">{centroCustoParam}</span>
                <span>• Histórico de Monitoramento</span>
              </div>
            </div>
          </div>

          {/* Resumo Rápido */}
          {!loading && grupos.length > 0 && (
            <div className="flex gap-3">
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="bg-blue-100 p-1.5 rounded-md text-blue-600"><BarChart3 size={18}/></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Visitas</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">{stats.totalVisitas}</p>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="bg-red-100 p-1.5 rounded-md text-red-600"><AlertTriangle size={18}/></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Alertas</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">{stats.totalAlertas}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Busca (Caso a lista fique grande) */}
        {!loading && grupos.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por data ou avaliador..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
            />
          </div>
        )}

        {/* Conteúdo Principal */}
        {loading ? (
          <LoadingSkeleton />
        ) : gruposFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-400" size={32} />
            </div>
            <h3 className="text-gray-900 font-semibold text-xl mb-2">
              {filtro ? 'Nenhum resultado para o filtro' : 'Nenhum registro encontrado'}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {filtro ? 'Tente buscar por outro termo.' : 'Não há histórico de monitoramento registrado para este local.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gruposFiltrados.map((grupo) => (
              <div 
                key={grupo.dataIso}
                onClick={() => router.push(`/local/${encodeURIComponent(centroCustoParam)}/${grupo.dataIso}`)}
                className="group bg-white rounded-xl border border-gray-200 p-0 cursor-pointer transition-all duration-300 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
              >
                {/* Header do Card */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 group-hover:bg-emerald-50/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-white border border-gray-200 shadow-sm p-2 rounded-lg group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                        <Calendar size={20} className="text-gray-600 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <span className="block font-bold text-gray-900 text-lg capitalize">
                          {grupo.dataFormatada}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {grupo.dataIso}
                        </span>
                      </div>
                    </div>
                    <ChevronRight 
                      size={20} 
                      className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" 
                    />
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Sprout size={16} className="text-emerald-500" />
                      <span>{grupo.totalPlantas} plantas</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} className="text-purple-500" />
                      <span className="truncate max-w-25" title={grupo.avaliadores.join(', ')}>
                        {grupo.avaliadores.length > 1 ? `${grupo.avaliadores.length} avaliadores` : grupo.avaliadores[0]}
                      </span>
                    </div>
                  </div>

                  {/* Status Footer */}
                  <div className="pt-2">
                    {grupo.alertasCriticos > 0 ? (
                      <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-700 py-2 rounded-lg w-full">
                        <AlertTriangle size={16} />
                        <span className="font-semibold text-sm">
                          {grupo.alertasCriticos} {grupo.alertasCriticos === 1 ? 'Crítico' : 'Críticos'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 py-2 rounded-lg w-full">
                        <CheckCircle size={16} />
                        <span className="font-semibold text-sm">Tudo Normal</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}