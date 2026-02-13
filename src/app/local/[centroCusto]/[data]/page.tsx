'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessoes } from '../../../../services/api';
import { locaPlanta } from '../../../../data/dados';
import { ArrowLeft, User, MapPin, CheckCircle, AlertTriangle, Sprout } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';

interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador: string;
  criadoEm: string;
  latitude?: number | null;
  longitude?: number | null;
  avaliacoes?: any[];
  relatorios?: any[];
}

const MapaCalor = dynamic(() => import('@/src/app/components/MapaCalor'), { 
  ssr: false,
  loading: () => <p className="text-black font-bold">Carregando mapa de satélite...</p>
});

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const centroCusto = decodeURIComponent(params.centroCusto as string);
  const dataFiltro = params.data as string; 

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);

  const infoLocal = locaPlanta.find((l: any) => l.centroCusto === centroCusto);
  const nomeLocal = infoLocal ? infoLocal.name : centroCusto;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const todos = await getSessoes();
      
      const filtrados = todos.filter((d: Sessao) => {
        const dia = d.criadoEm.split('T')[0];
        return d.centroCusto === centroCusto && dia === dataFiltro;
      });

      const dadosTratados = filtrados.map((sessao: Sessao) => {
        const gpsRef = sessao.avaliacoes?.find((av: any) => av.latitude && av.longitude);
        return {
          ...sessao,
          latitude: gpsRef?.latitude || null,
          longitude: gpsRef?.longitude || null
        };
      });

      setSessoes(dadosTratados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

 return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-white p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
          <button 
            onClick={() => router.back()} 
            className="text-gray-700 hover:bg-gray-100 p-1.5 sm:p-2 rounded-full transition-colors duration-200 shrink-0"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {nomeLocal}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-0.5 sm:mt-1 truncate">
              Registros de {dataFiltro ? format(parseISO(dataFiltro), 'dd/MM/yyyy') : 'Data inválida'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-600 mb-3 sm:mb-4"></div>
            <p className="text-gray-700 font-medium text-sm sm:text-base">Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Mapa de Severidade */}
            <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="bg-emerald-50 p-1.5 sm:p-2 rounded-lg">
                  <MapPin size={18} className="sm:w-5 sm:h-5 text-emerald-700" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                  Mapa de Severidade
                </h2>
              </div>
              <div className="rounded-lg sm:rounded-xl overflow-hidden border border-gray-300">
                <div className="min-h-75 sm:min-h-87.5 md:min-h-100 flex items-center justify-center">
                  <MapaCalor dados={sessoes} />
                </div>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3">
                Visualização da intensidade de ocorrências por área
              </p>
            </section>

            {/* Detalhamento por Planta */}
            <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-blue-50 p-1.5 sm:p-2 rounded-lg">
                  <Sprout size={18} className="sm:w-5 sm:h-5 text-blue-700" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                  Detalhamento por Planta
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5">
                {sessoes.map((sessao) => (
                  <div 
                    key={sessao.id} 
                    className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300"
                  >
                    {/* Cabeçalho da Planta */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-gray-100">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="bg-linear-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">
                          Planta {sessao.planta}
                        </span>
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">
                          Lote {sessao.lote}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700 bg-gray-50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                        <User size={12} className="sm:w-3.5 sm:h-3.5 text-gray-500" />
                        <span className="font-medium truncate">{sessao.nomeAvaliador}</span>
                      </div>
                    </div>

                    {/* Avaliações */}
                    {sessao.avaliacoes && sessao.avaliacoes.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {Object.values(
                          sessao.avaliacoes.reduce((acc: any, av: any) => {
                            if (!acc[av.doencaOuPraga]) acc[av.doencaOuPraga] = [];
                            acc[av.doencaOuPraga].push(av);
                            return acc;
                          }, {})
                        ).map((grupo: any, idx) => {
                          const nomeItem = grupo[0].doencaOuPraga;
                          const relatorio = sessao.relatorios?.find((r: any) => r.doencaOuPraga === nomeItem);
                          const porcentagem = relatorio ? relatorio.porcentagem : 0;
                          const ehCritico = porcentagem > 5;

                          return (
                            <div 
                              key={idx} 
                              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                                ehCritico 
                                  ? 'bg-linear-to-r from-red-50 to-red-100/50 border-red-200' 
                                  : 'bg-linear-to-r from-gray-50 to-gray-100/50 border-gray-200'
                              }`}
                            >
                              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                  {ehCritico ? (
                                    <div className="bg-red-100 p-1 sm:p-1.5 rounded shrink-0">
                                      <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-600" />
                                    </div>
                                  ) : (
                                    <div className="bg-green-100 p-1 sm:p-1.5 rounded shrink-0">
                                      <CheckCircle size={14} className="sm:w-4 sm:h-4 text-green-600" />
                                    </div>
                                  )}
                                  <strong className={`text-sm font-semibold truncate ${
                                    ehCritico ? 'text-red-800' : 'text-gray-800'
                                  }`}>
                                    {nomeItem}
                                  </strong>
                                </div>
                                <span className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                                  ehCritico ? 'text-red-700' : 'text-emerald-700'
                                }`}>
                                  {porcentagem.toFixed(2)}%
                                </span>
                              </div>

                              <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
                                {grupo.map((av: any, i: number) => (
                                  <div 
                                    key={i} 
                                    className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-white rounded-lg border border-gray-100"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                        {av.orgao}
                                      </span>
                                      {av.identificadorDeLocal && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                          {av.identificadorDeLocal}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      <span className="text-xs text-gray-600">Nota:</span>
                                      <span className={`font-bold text-sm sm:text-base ${
                                        av.nota >= 3 ? 'text-red-600' : 'text-emerald-600'
                                      }`}>
                                        {av.nota}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6 sm:py-8">
                        <div className="text-center">
                          <div className="bg-emerald-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                            <CheckCircle size={20} className="sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          <p className="text-emerald-700 font-medium text-sm sm:text-base">
                            Planta em condições saudáveis
                          </p>
                          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                            Sem registros de ocorrências
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}