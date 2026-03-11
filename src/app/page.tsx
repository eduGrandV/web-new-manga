'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, ArrowRight, Filter, Plus, Home, Calendar, 
  Search, BarChart3, CheckCircle2, Clock 
} from 'lucide-react';
import { getSessoes } from '../services/api';
import { LISTA_FAZENDAS, locaPlanta } from '../data/dados';
import { CriticalAlerts } from './components/CriticalAlerts';


interface Sessao {
  id: string;
  lote: string;         
  planta: number;       
  centroCusto: string;
  nomeAvaliador?: string;
  criadoEm: string;
  relatorios: any[];    
  [key: string]: any;   
}

interface LocalProcessado {
  id: number;
  name: string;
  centroCusto: string;
  qtdAvaliacoes: number;
  ultimaData: string | null;
  status: 'recente' | 'antigo' | 'sem_dados';
}


const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-44">
        <div className="flex justify-between mb-4">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
        <div className="mt-8 pt-4 border-t border-gray-100 flex gap-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function HomePage() {
  const router = useRouter();
  
  
  const [loading, setLoading] = useState(true);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  
  
  const [filtroTexto, setFiltroTexto] = useState("");
  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  
  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const data = await getSessoes();
        setSessoes(data);
      } catch (error) {
        console.error("Erro ao buscar sessões:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  
  
  const locaisProcessados = useMemo(() => {
    
    const sessoesFiltradas = sessoes.filter(s => {
      const dataSessao = s.criadoEm.split("T")[0];
      if (dataInicio && dataSessao < dataInicio) return false;
      if (dataFim && dataSessao > dataFim) return false;
      return true;
    });

    
    const locais = locaPlanta.map(local => {
      const avaliacoesDoLocal = sessoesFiltradas.filter(
        d => d.centroCusto === local.centroCusto
      );

      
      const avaliacoesOrdenadas = [...avaliacoesDoLocal].sort(
        (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

      const ultimaData = avaliacoesOrdenadas[0]?.criadoEm || null;
      
      
      let status: LocalProcessado['status'] = 'sem_dados';
      if (ultimaData) {
        const diasDesdeUltima = (new Date().getTime() - new Date(ultimaData).getTime()) / (1000 * 3600 * 24);
        status = diasDesdeUltima <= 7 ? 'recente' : 'antigo';
      }

      return {
        ...local,
        qtdAvaliacoes: avaliacoesDoLocal.length,
        ultimaData,
        status,
        temDados: avaliacoesDoLocal.length > 0
      };
    });

    
    return locais
      .filter(l => l.temDados) 
      .filter(l => {
        if (fazendaSelecionada && !l.name.includes(fazendaSelecionada)) return false;
        if (filtroTexto) {
          const termo = filtroTexto.toLowerCase();
          return l.name.toLowerCase().includes(termo) || l.centroCusto.includes(termo);
        }
        return true;
      })
      .sort((a, b) => {
        const dataA = a.ultimaData ? new Date(a.ultimaData).getTime() : 0;
        const dataB = b.ultimaData ? new Date(b.ultimaData).getTime() : 0;
        return dataB - dataA;
      });

  }, [sessoes, dataInicio, dataFim, filtroTexto, fazendaSelecionada]);

  
  const stats = useMemo(() => {
    const totalAvaliacoes = locaisProcessados.reduce((acc, curr) => acc + curr.qtdAvaliacoes, 0);
    const locaisAtivos = locaisProcessados.length;
    return { totalAvaliacoes, locaisAtivos };
  }, [locaisProcessados]);

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Monitoramento Agrícola
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Visão consolidada das áreas e indicadores de qualidade.
            </p>
          </div>
          <button
            onClick={() => router.push("/registrar")}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
            Novo Registro
          </button>
        </div>

        {/* Alertas Críticos (Componente Existente) */}
        <CriticalAlerts
          dados={sessoes}
          dataInicio={dataInicio}
          dataFim={dataFim}
        />

        {/* Barra de Filtros e Estatísticas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          
          {/* Linha de Resumo */}
          <div className="flex gap-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={20}/></div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Locais Filtrados</p>
                <p className="text-lg font-bold text-gray-900">{stats.locaisAtivos}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BarChart3 size={20}/></div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Total Avaliações</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalAvaliacoes}</p>
              </div>
            </div>
          </div>

          {/* Inputs de Filtro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca Texto */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar Talhão, Lote ou CC..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>

            {/* Select Fazenda */}
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={fazendaSelecionada}
                onChange={(e) => setFazendaSelecionada(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="">Todas as Fazendas</option>
                {LISTA_FAZENDAS.map((f) => (
                  <option key={f.valor} value={f.valor}>{f.label}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
            </div>

            {/* Datas */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">DE:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none text-sm text-gray-600"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">ATÉ:</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none text-sm text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Grid de Resultados */}
        {loading ? (
          <LoadingSkeleton />
        ) : locaisProcessados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros de data ou busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {locaisProcessados.map((local) => (
              <div
                key={local.id}
                onClick={() => router.push(`/local/${encodeURIComponent(local.centroCusto)}`)}
                className="group bg-white rounded-xl border border-gray-200 p-0 cursor-pointer transition-all duration-200 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
              >
                {/* Header do Card */}
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-gray-100 text-gray-600 text-xs font-mono font-medium px-2 py-1 rounded-md border border-gray-200">
                      CC: {local.centroCusto}
                    </span>
                    {local.status === 'recente' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Clock size={12} /> Antigo
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {local.name}
                  </h3>
                </div>

                {/* Footer do Card */}
                <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Última avaliação</span>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500"/>
                      {local.ultimaData ? new Date(local.ultimaData).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                    <ArrowRight size={16} />
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