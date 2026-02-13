'use client';

import { locaPlanta } from '@/src/data/dados';
import { AlertTriangle, Calendar, CheckCircle, FileDown, Hash, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador?: string;
  criadoEm: string;
  relatorios: any[];
}

interface CriticalAlertsProps {
  dados: Sessao[];
  dataInicio?: string;
  dataFim?: string;
}

export function CriticalAlerts({ dados, dataInicio, dataFim }: CriticalAlertsProps) {
  
  const alertas = dados.flatMap(sessao => {
    const localEncontrado = locaPlanta.find(l => l.centroCusto === sessao.centroCusto);
    const nomeCompleto = localEncontrado ? localEncontrado.name : `Lote ${sessao.lote}`;

    return (sessao.relatorios || [])
      .filter((rel: any) => rel.porcentagem > 5)
      .map((rel: any) => ({
        ...rel,
        nomeLocal: nomeCompleto,
        lote: sessao.lote,
        planta: sessao.planta,
        centroCusto: sessao.centroCusto,
        nomeAvaliador: sessao.nomeAvaliador || 'N/A',
        data: sessao.criadoEm
      }));
  }).filter(alerta => {
    const dataAlerta = alerta.data.split('T')[0];
    if (dataInicio && dataAlerta < dataInicio) return false;
    if (dataFim && dataAlerta > dataFim) return false;
    return true;
  }).sort((a, b) => b.porcentagem - a.porcentagem);

  const gerarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Relatório de Alertas Críticos (>5%)", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Período: ${dataInicio || 'Início'} até ${dataFim || 'Hoje'}`, 14, 22);

    const dadosTabela = alertas.map(a => [
      new Date(a.data).toLocaleDateString('pt-BR'),
      a.nomeLocal,
      a.planta.toString(),
      a.doencaOuPraga,
      `${a.porcentagem.toFixed(1)}%`,
      a.nomeAvaliador
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Data', 'Local', 'Planta', 'Problema', 'Nível', 'Avaliador']],
      body: dadosTabela,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] } 
    });

    doc.save(`alertas_criticos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (alertas.length === 0) return null;

 return (
    <div className="bg-linear-to-r from-red-50 to-red-100/30 border border-red-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-red-100 p-1.5 sm:p-2 rounded-lg">
            <AlertTriangle className="text-red-600" size={18}  />
          </div>
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              Alertas Críticos ({'>'}5%)
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Monitoramento com alta incidência de ocorrências
            </p>
          </div>
        </div>
        <button 
          onClick={gerarPDF}
          className="w-full sm:w-auto bg-linear-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 text-sm font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FileDown size={14} className="sm:w-4 sm:h-4" /> 
          <span>Baixar Relatório</span>
        </button>
      </div>
      
      {alertas.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 sm:p-6 text-center">
          <div className="bg-green-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <CheckCircle className="text-green-600" size={20}  />
          </div>
          <p className="text-gray-700 font-medium text-sm sm:text-base">
            Nenhum alerta crítico detectado
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Todas as áreas estão dentro dos parâmetros normais
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600">
              {alertas.length} {alertas.length === 1 ? 'alerta crítico' : 'alertas críticos'} identificados
            </p>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Alto Risco</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-x-auto pb-3 -mx-2 px-2">
              <div className="flex gap-3 sm:gap-4 min-w-max">
                {alertas.map((alerta, idx) => (
                  <div 
                    key={idx} 
                    className="min-w-64 sm:min-w-72 bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:border-red-300 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-red-100 px-2 py-0.5 rounded-full">
                            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide truncate">
                              {alerta.doencaOuPraga} 
                            </span>
                          </div>
                          
                        </div>
                        
                        <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-2">
                          {alerta.porcentagem.toFixed(2)}%
                        </div>
                      </div>
                      
                     
                    </div>
                    
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-50 p-1.5 rounded">
                          <MapPin className="text-gray-600" size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {alerta.nomeLocal}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            CC: {alerta.centroCusto || "N/A"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-50 p-1.5 rounded">
                          <Hash className="text-gray-600" size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">
                            Lote: <span className="font-semibold">{alerta.lote || "N/A"}</span>
                          </p>
                          <p className="text-xs text-gray-600">
                            Planta: <span className="font-semibold">{alerta.planta}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-50 p-1.5 rounded">
                          <Calendar className="text-gray-600" size={14} />
                        </div>
                        <div className="text-xs font-medium text-gray-700">
                          {new Date(alerta.data).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    
                    
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-linear-to-l from-white to-transparent w-8 h-full pointer-events-none hidden sm:block"></div>
          </div>
        </>
      )}
    </div>
  );
}