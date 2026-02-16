"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, Filter, Plus, Home, Calendar } from "lucide-react";
import { getSessoes } from "../services/api";
import { LISTA_FAZENDAS, locaPlanta } from "../data/dados";
import { CriticalAlerts } from "./components/CriticalAlerts";

export default function HomePage() {
  const router = useRouter();
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [locaisComDados, setLocaisComDados] = useState<any[]>([]);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (sessoes.length > 0) {
      aplicarFiltrosDeData();
    }
  }, [sessoes, dataInicio, dataFim]);

  const carregarDados = async () => {
    const dados = await getSessoes();
    setSessoes(dados);
  };

  const aplicarFiltrosDeData = () => {
    let dadosFiltrados = sessoes;

    if (dataInicio) {
      dadosFiltrados = dadosFiltrados.filter(
        (d) => d.criadoEm.split("T")[0] >= dataInicio,
      );
    }

    if (dataFim) {
      dadosFiltrados = dadosFiltrados.filter(
        (d) => d.criadoEm.split("T")[0] <= dataFim,
      );
    }

    processarLocais(dadosFiltrados);
  };

  const processarLocais = (dados: any[]) => {
    const listaProcessada = locaPlanta.map((local) => {
      const avaliacoesDoLocal = dados.filter(
        (d) => d.centroCusto === local.centroCusto,
      );

      const ultimaAvaliacao = avaliacoesDoLocal.sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
      )[0];

      return {
        ...local,
        qtdAvaliacoes: avaliacoesDoLocal.length,
        ultimaData: ultimaAvaliacao ? ultimaAvaliacao.criadoEm : null,
        temDados: avaliacoesDoLocal.length > 0,
      };



    });

    listaProcessada.sort((a, b) => {
      const dataA = a.ultimaData ? new Date(a.ultimaData).getTime() : 0;
      const dataB = b.ultimaData ? new Date(b.ultimaData).getTime() : 0;

      return dataB - dataA

    });

    setLocaisComDados(listaProcessada);
  };

  const locaisFiltrados = locaisComDados.filter((l) => {
    if (!l.temDados) return false;
    if (fazendaSelecionada && !l.name.includes(fazendaSelecionada))
      return false;
    if (filtroTexto) {
      const termo = filtroTexto.toLowerCase();
      return (
        l.name.toLowerCase().includes(termo) || l.centroCusto.includes(termo)
      );
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-emerald-50 from-gray-50 to-white p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl ext-3xl font-semibold text-green-800 tracking-tight leading-tight">
              Monitoramento Agrícola
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Visão geral das áreas com registros
            </p>
          </div>
          <button
            onClick={() => router.push("/registrar")}
            className="w-full sm:w-auto bg-linear-to-r from-emerald-600 to-emerald-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-md hover:shadow-lg mt-2 sm:mt-0"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" /> Novo Registro
          </button>
        </div>

        <CriticalAlerts
          dados={sessoes}
          dataInicio={dataInicio}
          dataFim={dataFim}
        />

        <div className="bg-linear-to-r from-gray-50 to-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 md:w-1/3">
                <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <Home className="text-emerald-700 sm:w-5 sm:h-5" size={18} />
                </div>
                <select
                  value={fazendaSelecionada}
                  onChange={(e) => setFazendaSelecionada(e.target.value)}
                  className={`w-full border text-gray-900 font-medium p-2.5 sm:p-3 rounded-lg ${fazendaSelecionada ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"} focus:outline-none focus:border-emerald-500 transition-all text-sm sm:text-base`}
                >
                  <option value="">Todas as Fazendas</option>
                  {LISTA_FAZENDAS.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <Filter
                    className="text-emerald-700 sm:w-5 sm:h-5"
                    size={18}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por Talhão, Lote ou CC..."
                  className={`w-full border text-gray-900 font-medium p-2.5 sm:p-3 rounded-lg ${filtroTexto ? "bg-gray-100 border-gray-300" : "bg-white border-gray-400"} focus:outline-none focus:border-emerald-500 text-sm sm:text-base`}
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 border-t border-gray-200 pt-3 sm:pt-4">
              <div className="flex items-center gap-2 sm:gap-3 md:w-1/2">
                <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <Calendar
                    className="text-emerald-700 sm:w-5 sm:h-5"
                    size={18}
                  />
                </div>
                <div className="flex flex-col xs:flex-row items-center gap-2 w-full">
                  <div className="w-full">
                    <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className={`w-full border text-gray-900 font-medium p-2 sm:p-2.5 rounded-lg ${dataInicio ? "bg-gray-100 border-gray300" : "bg-white border-gray-400"}focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base`}
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-xs font-bold text-gray-500 ml-1 block mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className={`w-full border text-gray-900 font-medium p-2 sm:p-2.5 rounded-lg ${dataFim ? "bg-gray-100 border-gray-300" : "bg-white border-gray-400"}focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {locaisFiltrados.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-100 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto px-4">
              <div className="bg-gray-300 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="text-red-500 sm:w-7 sm:h-7" size={24} />
              </div>
              <h3 className="text-gray-900 font-semibold text-lg sm:text-xl mb-2">
                Nenhum local encontrado
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Verifique os filtros aplicados ou sincronize novos dados
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {locaisFiltrados.map((local) => (
              <div
                key={local.id}
                onClick={() =>
                  router.push(`/local/${encodeURIComponent(local.centroCusto)}`)
                }
                className="group bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:border-emerald-300 hover:shadow-md sm:hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="bg-linear-to-r from-emerald-50 to-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full truncate max-w-[70%]">
                    CC: {local.centroCusto}
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-all shrink-0"
                  />
                </div>

                <h3 className="text-gray-900 font-bold text-base sm:text-lg mb-4 sm:mb-5 line-clamp-2 min-h-12 sm:min-h-14">
                  {local.name}
                </h3>

                <div className="border-t border-gray-100 pt-3 sm:pt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-gray-700 mb-0.5">
                    <MapPin
                      size={14}
                      className="sm:w-4 sm:h-4 text-emerald-600 shrink-0"
                    />
                    <span className="truncate">
                      {local.qtdAvaliacoes}{" "}
                      {local.qtdAvaliacoes === 1 ? "avaliação" : "avaliações"}
                    </span>
                  </div>

                  {local.ultimaData && (
                    <div className="text-xs font-medium text-gray-500 truncate">
                      Última:{" "}
                      {new Date(local.ultimaData).toLocaleDateString("pt-BR")}
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
