'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessoes } from '../../../../services/api';
import { locaPlanta } from '../../../../data/dados';
import { 
  ArrowLeft, MapPin, Sprout, ChevronDown, ChevronUp, 
  AlertOctagon, CheckCircle2, Leaf, Microscope, 
  ThermometerSun, Droplets, Wind, ScanLine
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';

const MapaCalor = dynamic(() => import('@/src/app/components/MapaCalor'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900/50 animate-pulse flex items-center justify-center text-emerald-400 font-mono">INICIALIZANDO SATÉLITE...</div>
});

// --- COMPONENTE: BARRA DE SEVERIDADE (Visual Tech) ---
const SeverityBar = ({ percent }: { percent: number }) => {
  const isCritical = percent > 5;
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
      <div 
        className={`h-full transition-all duration-500 ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
};

// --- COMPONENTE: CARD EXPANSÍVEL (Estilo HUD) ---
const PragaCardTech = ({ relatorio, notasDetalhadas }: { relatorio: any, notasDetalhadas: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCritico = relatorio.porcentagem > 5;

  return (
    <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
      isOpen ? 'bg-white shadow-xl ring-1 ring-emerald-500/20' : 'bg-white/60 hover:bg-white shadow-sm border-gray-200'
    }`}>
      
      {/* LINHA DE STATUS LATERAL */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritico ? 'bg-red-500' : 'bg-emerald-500'}`} />

      {/* CABEÇALHO CLICÁVEL */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 pl-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${isCritico ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isCritico ? <AlertOctagon size={22} /> : <Microscope size={22} />}
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-800 text-lg leading-tight">{relatorio.doencaOuPraga}</h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
              {relatorio.orgao}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-24 text-right">
            <div className="flex items-end justify-end gap-1">
              <span className={`text-2xl font-black ${isCritico ? 'text-red-600' : 'text-slate-700'}`}>
                {relatorio.porcentagem.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 mb-1">%</span>
            </div>
            <SeverityBar percent={relatorio.porcentagem} />
          </div>
          <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100' : ''}`}>
            <ChevronDown size={20} className="text-slate-400" />
          </div>
        </div>
      </button>

      {/* ÁREA DE DETALHES (ANIMAÇÃO) */}
      {isOpen && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-4 pl-6 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notasDetalhadas.length > 0 ? notasDetalhadas.map((nota, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${nota.identificadorDeLocal === 'Bordadura' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                      <span className="text-xs font-bold text-slate-600 uppercase">{nota.identificadorDeLocal || 'Geral'}</span>
                   </div>
                   
                   <div className="flex gap-2 font-mono text-[10px]">
                      {nota.quadrante && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">Q:{nota.quadrante}</span>}
                      {nota.ramo && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">R:{nota.ramo}</span>}
                   </div>
                </div>

                <div className="flex flex-col items-center">
                   <span className="text-[9px] font-bold text-slate-400 uppercase">Nota</span>
                   <span className={`text-lg font-black ${nota.nota >= 3 ? 'text-red-500' : 'text-emerald-500'}`}>
                     {nota.nota}
                   </span>
                </div>

              </div>
            )) : (
              <p className="text-sm text-slate-400 italic col-span-2">Sem notas individuais registradas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const centroCusto = decodeURIComponent(params.centroCusto as string);
  const dataFiltro = params.data as string; 

  const [sessoes, setSessoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA DE CÁLCULO MANTIDA ---
  const calcularPorcentagemManual = (sessao: any, nomeItem: string) => {
    const notasDoItem = sessao.avaliacoes?.filter((av: any) => (av.doencaOuPraga || av.doenca) === nomeItem) || [];
    if (notasDoItem.length === 0) return 0;

    const nomeCheck = nomeItem.toUpperCase();
    const isPraga = ["COCHONILHA", "MOSCA", "ACÁRO", "TRIPS", "PULGÃO"].some(p => nomeCheck.includes(p));

    if (isPraga) {
      const bNotas = notasDoItem.filter((r: any) => r.identificadorDeLocal === "Bordadura");
      const aNotas = notasDoItem.filter((r: any) => r.identificadorDeLocal === "Área interna da parcela");
      const totalB = bNotas.reduce((acc: number, curr: any) => acc + (Number(curr.nota) || 1), 0);
      const totalA = aNotas.reduce((acc: number, curr: any) => acc + (Number(curr.nota) || 1), 0);
      const mult = notasDoItem.some((r: any) => !!r.ramo) ? 8 : 4;
      const pctB = (totalB * 100) / (4 * mult);
      const pctA = (totalA * 100) / (6 * mult);
      return (pctB + pctA) / 2;
    } else {
      const total = notasDoItem.reduce((acc: number, curr: any) => acc + (Number(curr.nota) || 1), 0);
      const divisor = notasDoItem[0]?.orgao?.toUpperCase().includes("FOLHA") ? 8 : 4;
      return (total * 100) / divisor;
    }
  };

  const carregarDados = async () => {
    try {
      const todos = await getSessoes();
      const filtrados = todos.filter((d: any) => {
        const dia = d.criadoEm ? d.criadoEm.substring(0, 10) : '';
        return d.centroCusto === centroCusto && dia === dataFiltro;
      });

      const dadosTratados = filtrados.map((sessao: any) => {
        const gpsRef = sessao.avaliacoes?.find((av: any) => av.latitude && av.longitude);
        const relatoriosTratados = sessao.relatorios?.map((rel: any) => {
          let pct = Number(rel.porcentagem);
          if (!pct || pct === 0) { pct = calcularPorcentagemManual(sessao, rel.doencaOuPraga); }
          return { ...rel, porcentagem: pct };
        });

        return {
          ...sessao,
          relatorios: relatoriosTratados,
          latitude: gpsRef?.latitude || null,
          longitude: gpsRef?.longitude || null
        };
      });

      setSessoes(dadosTratados);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, []);

  const infoLocal = locaPlanta.find((l: any) => l.centroCusto === centroCusto);
  const nomeLocal = infoLocal ? infoLocal.name : centroCusto;

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-slate-800">
      
      {/* HEADER FLUTUANTE */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 md:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">{nomeLocal}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
              <ScanLine size={12} /> LOTE MONITORADO
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data:</span>
           <span className="text-sm font-bold text-slate-800">
             {dataFiltro ? format(parseISO(dataFiltro), "dd MMM yyyy", { locale: ptBR }).toUpperCase() : '--'}
           </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {loading ? (
           <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
             <span className="font-mono text-xs uppercase tracking-widest">Carregando dados...</span>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* COLUNA 1: MAPA RADAR (Fixo na esquerda em Desktop) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-4">
              <div className="bg-white rounded-2xl p-1 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                 <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                    <MapPin size={12} className="text-emerald-500" /> SATÉLITE
                 </div>
                 <div className="h-100 w-full rounded-xl overflow-hidden bg-slate-900">
                    <MapaCalor dados={sessoes} />
                 </div>
                 
                 {/* Mini Stats Overlay */}
                 <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
                    <div className="bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Plantas</p>
                       <p className="text-xl font-black text-slate-800">{sessoes.length}</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Alertas</p>
                       <p className="text-xl font-black text-red-500">
                         {sessoes.filter(s => s.relatorios?.some((r:any) => r.porcentagem > 5)).length}
                       </p>
                    </div>
                 </div>
              </div>

             
            </div>

            {/* COLUNA 2: STREAM DE DADOS (Lista de Plantas) */}
            <div className="lg:col-span-8 space-y-6">
              {sessoes.map((sessao, index) => (
                <div key={sessao.id} className="relative pl-0 md:pl-8 transition-all duration-300">
                  
                  {/* Linha do Tempo (Decorativa) */}
                  <div className="hidden md:block absolute left-3 top-0 bottom-0 w-px bg-slate-200"></div>
                  <div className="hidden md:flex absolute left-0 top-6 w-7 h-7 bg-white border-4 border-emerald-100 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>

                  {/* Card Principal da Planta */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                    
                    {/* Header da Planta */}
                    <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-200 flex items-center justify-center text-white font-black text-xl">
                          {sessao.planta}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Planta {sessao.planta}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-500 uppercase">
                              LOTE {sessao.lote}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">{sessao.nomeAvaliador}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Geral da Planta */}
                      {(!sessao.relatorios || sessao.relatorios.length === 0) ? (
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/50 text-emerald-700 rounded-lg text-sm font-bold">
                            <CheckCircle2 size={16} /> Saudável
                         </div>
                      ) : (
                         <div className="flex -space-x-2">
                            {/* Avatares das pragas encontradas (Decorativo) */}
                            {sessao.relatorios.slice(0, 3).map((r:any, i:number) => (
                              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${r.porcentagem > 5 ? 'bg-red-500' : 'bg-emerald-400'}`}>
                                {r.doencaOuPraga.charAt(0)}
                              </div>
                            ))}
                            {sessao.relatorios.length > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                +{sessao.relatorios.length - 3}
                              </div>
                            )}
                         </div>
                      )}
                    </div>

                    {/* Lista de Pragas (Acordeão) */}
                    <div className="p-2 space-y-2 mt-2">
                       {sessao.relatorios?.map((rel: any, idx: number) => {
                          const notasDestaPraga = sessao.avaliacoes?.filter((av: any) => 
                            (av.doencaOuPraga || av.doenca) === rel.doencaOuPraga
                          ) || [];
                          return <PragaCardTech key={idx} relatorio={rel} notasDetalhadas={notasDestaPraga} />;
                       })}
                       
                       {(!sessao.relatorios || sessao.relatorios.length === 0) && (
                         <div className="py-8 flex flex-col items-center justify-center text-slate-300">
                            <Sprout size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">Nenhuma praga detectada nesta planta.</p>
                         </div>
                       )}
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}