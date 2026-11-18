import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import {
  LayoutDashboard, GitCompare, Table2, BookOpen,
  Download, Search, Activity, RefreshCw, ArrowRight,
  Flame, Users, Gauge, Factory, Zap, TrendingDown,
  ExternalLink, Sliders, Calculator, Printer, Sparkles,
  Trees, Car, DollarSign
} from 'lucide-react';
import WorldMap from './WorldMap';

const TOP_COLORS = ['#EF4444', '#F97316', '#EAB308', '#F472B6', '#A855F7'];
const PIE_COLORS = ['#EF4444', '#F97316', '#10B981', '#52525B'];

const COUNTRY_LABELS = {
  'United States': 'USA',
  Russia: 'Rusia',
  Japan: 'Japón',
  Germany: 'Alemania',
  Mexico: 'México',
  Brazil: 'Brasil',
  Spain: 'España'
};

const formatName = (name) => (COUNTRY_LABELS[name] ? COUNTRY_LABELS[name] : name);

const formatLargeNumber = (num) => {
  if (!num) return 'N/D';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)} T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)} B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)} M`;
  return num.toLocaleString('en-US');
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [dataFull, setDataFull] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview | simulator | esg_calc | compare | table
  const [rankMode, setRankMode] = useState('emitters');
  const [selectedYear, setSelectedYear] = useState(2023);
  const [execStartYear, setExecStartYear] = useState(2010);
  const [execEndYear, setExecEndYear] = useState(2023);
  const [selectedCountry, setSelectedCountry] = useState('China');
  const [compareCountry, setCompareCountry] = useState('United States');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Controles del Simulador What-If (2024 - 2030)
  const [coalCutPct, setCoalCutPct] = useState(25);
  const [oilCutPct, setOilCutPct] = useState(15);
  const [gasCutPct, setGasCutPct] = useState(10);

  // Controles de la Calculadora ESG Corporativa
  const [employeesCount, setEmployeesCount] = useState(150);
  const [monthlyMwh, setMonthlyMwh] = useState(45);
  const [fleetVehicles, setFleetVehicles] = useState(20);

  const [netMetrics, setNetMetrics] = useState({
    latencyMs: 0,
    payloadKb: 0,
    status: 'Conectando...',
    lastSync: ''
  });

  const fetchDatabase = () => {
    setLoading(true);
    const startTime = performance.now();

    const apiUrl = import.meta.env.DEV
      ? 'http://localhost:3001/api/emisiones'
      : './emisiones.php';

    fetch(apiUrl)
      .then(async (res) => {
        const text = await res.text();
        const endTime = performance.now();
        const parsed = JSON.parse(text);

        setNetMetrics({
          latencyMs: Math.round(endTime - startTime),
          payloadKb: (new Blob([text]).size / 1024).toFixed(1),
          status: import.meta.env.DEV ? 'En línea (Local Node.js)' : 'En línea (MariaDB)',
          lastSync: new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        });

        setDataFull(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error:', err);
        setNetMetrics((prev) => ({ ...prev, status: 'Sin conexión' }));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const years = useMemo(() => {
    const u = [...new Set(dataFull.map((d) => d.year))].sort((a, b) => b - a);
    return u.length ? u : [2023];
  }, [dataFull]);

  const countries = useMemo(
    () => [...new Set(dataFull.map((d) => d.country))].sort(),
    [dataFull]
  );

  const yearData = useMemo(
    () => dataFull.filter((d) => d.year === selectedYear),
    [dataFull, selectedYear]
  );

  // --- DATOS AGRUPADOS POR RANGO PARA LA VISTA EJECUTIVA ---
  const execRangeData = useMemo(() => {
    const filtered = dataFull.filter(
      (d) => d.year >= execStartYear && d.year <= execEndYear
    );
    const grouped = {};

    filtered.forEach((d) => {
      if (!grouped[d.country]) {
        grouped[d.country] = {
          country: d.country,
          iso_code: d.iso_code,
          co2: 0,
          coal_co2: 0,
          oil_co2: 0,
          gas_co2: 0,
          cement_co2: 0,
          flaring_co2: 0,
          perCapitaSum: 0,
          perCapitaCount: 0,
          population: 0,
          gdp: 0,
          latestYear: 0
        };
      }
      const g = grouped[d.country];
      g.co2 += Number(d.co2 || 0);
      g.coal_co2 += Number(d.coal_co2 || 0);
      g.oil_co2 += Number(d.oil_co2 || 0);
      g.gas_co2 += Number(d.gas_co2 || 0);
      g.cement_co2 += Number(d.cement_co2 || 0);
      g.flaring_co2 += Number(d.flaring_co2 || 0);

      if (d.co2_per_capita > 0) {
        g.perCapitaSum += Number(d.co2_per_capita);
        g.perCapitaCount += 1;
      }
      if (d.year >= g.latestYear) {
        g.latestYear = d.year;
        if (d.population > 0) g.population = Number(d.population);
        if (d.gdp > 0) g.gdp = Number(d.gdp);
      }
    });

    return Object.values(grouped).map((g) => ({
      ...g,
      co2_per_capita: g.perCapitaCount > 0 ? g.perCapitaSum / g.perCapitaCount : 0
    }));
  }, [dataFull, execStartYear, execEndYear]);

  const activeDataset = activeView === 'overview' ? execRangeData : yearData;

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return activeDataset
      .filter((d) => {
        const matchCountry = d.country.toLowerCase().includes(q);
        const matchLabel = formatName(d.country).toLowerCase().includes(q);
        const matchIso = d.iso_code ? d.iso_code.toLowerCase().includes(q) : false;
        return matchCountry ? true : matchLabel ? true : matchIso;
      })
      .slice(0, 8);
  }, [activeDataset, searchTerm]);

  const currentRecord = useMemo(() => {
    const found = yearData.find((d) => d.country === selectedCountry);
    return found ? found : {};
  }, [yearData, selectedCountry]);

  const execCurrentRecord = useMemo(
    () => execRangeData.find((d) => d.country === selectedCountry) || {},
    [execRangeData, selectedCountry]
  );

  const latestGdpRecord = useMemo(() => {
    if (currentRecord.gdp > 0) return currentRecord;
    const f2022 = dataFull.find((d) => d.year === 2022 && d.country === selectedCountry);
    return f2022 ? f2022 : {};
  }, [dataFull, currentRecord, selectedCountry]);

  const variationPct = useMemo(() => {
    const r2010 = dataFull.find((d) => d.year === 2010 && d.country === selectedCountry);
    const r2023 = dataFull.find((d) => d.year === 2023 && d.country === selectedCountry);
    if (r2010?.co2 > 0 && r2023?.co2 > 0) {
      return (((r2023.co2 - r2010.co2) / r2010.co2) * 100).toFixed(1);
    }
    return '0.0';
  }, [dataFull, selectedCountry]);

  const execVariationPct = useMemo(() => {
    if (execStartYear === execEndYear) return '0.0';
    const rStart = dataFull.find(
      (d) => d.year === execStartYear && d.country === selectedCountry
    );
    const rEnd = dataFull.find(
      (d) => d.year === execEndYear && d.country === selectedCountry
    );
    if (rStart?.co2 > 0 && rEnd?.co2 > 0) {
      return (((rEnd.co2 - rStart.co2) / rStart.co2) * 100).toFixed(1);
    }
    return '0.0';
  }, [dataFull, selectedCountry, execStartYear, execEndYear]);

  const currentIntensity = useMemo(() => {
    if (currentRecord.co2 > 0 && currentRecord.gdp > 0) {
      return (currentRecord.co2 / (currentRecord.gdp / 1e9)).toFixed(2);
    }
    const f2022 = dataFull.find((d) => d.year === 2022 && d.country === selectedCountry);
    if (f2022?.co2 > 0 && f2022?.gdp > 0) {
      return (f2022.co2 / (f2022.gdp / 1e9)).toFixed(2);
    }
    return 'N/D';
  }, [dataFull, currentRecord, selectedCountry]);

  const execIntensity = useMemo(() => {
    const rEnd = dataFull.find(
      (d) => d.year === execEndYear && d.country === selectedCountry
    );
    if (rEnd?.co2 > 0 && rEnd?.gdp > 0) {
      return (rEnd.co2 / (rEnd.gdp / 1e9)).toFixed(2);
    }
    return currentIntensity;
  }, [dataFull, selectedCountry, execEndYear, currentIntensity]);

  const top5Data = useMemo(() => {
    return execRangeData
      .filter((d) => d.co2 > 0)
      .sort((a, b) => b.co2 - a.co2)
      .slice(0, 5)
      .map((d) => ({
        country: d.country,
        label: formatName(d.country),
        iso: d.iso_code,
        co2: Number(d.co2.toFixed(1)),
        metricText: `${(d.co2 / 1000).toFixed(1)}k Mt`
      }));
  }, [execRangeData]);

  const dynamicRankingList = useMemo(() => {
    if (rankMode === 'emitters') {
      return top5Data;
    }

    if (rankMode === 'reducers') {
      const list = [];
      const refStart = execStartYear === execEndYear ? 2010 : execStartYear;
      const refEnd = execStartYear === execEndYear ? 2023 : execEndYear;

      countries.forEach((c) => {
        const rStart = dataFull.find((d) => d.year === refStart && d.country === c);
        const rEnd = dataFull.find((d) => d.year === refEnd && d.country === c);
        if (rStart?.co2 > 50 && rEnd?.co2 > 0) {
          const pct = ((rEnd.co2 - rStart.co2) / rStart.co2) * 100;
          list.push({
            country: c,
            label: formatName(c),
            iso: rEnd.iso_code,
            pctVal: pct,
            metricText: `${pct.toFixed(1)}%`
          });
        }
      });
      return list.sort((a, b) => a.pctVal - b.pctVal).slice(0, 5);
    }

    const intYear = execEndYear === 2023 ? 2022 : execEndYear;
    return dataFull
      .filter((d) => d.year === intYear && d.co2 > 50 && d.gdp > 0)
      .map((d) => {
        const val = d.co2 / (d.gdp / 1e9);
        return {
          country: d.country,
          label: formatName(d.country),
          iso: d.iso_code,
          intVal: val,
          metricText: `${val.toFixed(2)} kg`
        };
      })
      .sort((a, b) => b.intVal - a.intVal)
      .slice(0, 5);
  }, [rankMode, top5Data, countries, dataFull, execStartYear, execEndYear]);

  const executiveSummary = useMemo(() => {
    const validRows = yearData.filter((d) => d.co2 > 0);
    const totalWorld = validRows.reduce((acc, d) => acc + d.co2, 0);
    const sharePct =
      totalWorld > 0 && currentRecord.co2 > 0
        ? ((currentRecord.co2 / totalWorld) * 100).toFixed(1)
        : '0.0';

    const varNum = Number(variationPct);
    const trendPhrase =
      varNum < 0
        ? `ha logrado desacoplar su huella reduciendo sus emisiones en ${Math.abs(varNum)}% desde 2010`
        : `registra una expansión industrial de +${varNum}% en sus emisiones acumuladas desde 2010`;

    return `En ${selectedYear}, ${formatName(selectedCountry)} aportó el ${sharePct}% del CO₂ global (${
      currentRecord.co2 ? currentRecord.co2.toFixed(1) : '0'
    } Mt). A nivel estructural, el país ${trendPhrase}, manteniendo una intensidad de ${currentIntensity} kg de CO₂ por cada $1,000 USD de PIB.`;
  }, [yearData, currentRecord, selectedYear, selectedCountry, variationPct, currentIntensity]);

  const execSummary = useMemo(() => {
    const validRows = execRangeData.filter((d) => d.co2 > 0);
    const totalWorld = validRows.reduce((acc, d) => acc + d.co2, 0);
    const sharePct =
      totalWorld > 0 && execCurrentRecord.co2 > 0
        ? ((execCurrentRecord.co2 / totalWorld) * 100).toFixed(1)
        : '0.0';

    const varNum = Number(execVariationPct);
    const periodLabel =
      execStartYear === execEndYear
        ? `En ${execStartYear}`
        : `Entre ${execStartYear} y ${execEndYear}`;
    const trendPhrase =
      varNum < 0
        ? `redujo sus emisiones en ${Math.abs(varNum)}% durante el periodo`
        : `registró un incremento de +${varNum}% en sus emisiones en ese lapso`;

    return `${periodLabel}, ${formatName(selectedCountry)} aportó el ${sharePct}% del CO₂ global acumulado (${
      execCurrentRecord.co2 ? execCurrentRecord.co2.toFixed(1) : '0'
    } Mt). A nivel estructural, el país ${trendPhrase}, manteniendo una intensidad de ${execIntensity} kg de CO₂ por cada $1,000 USD de PIB.`;
  }, [
    execRangeData,
    execCurrentRecord,
    execStartYear,
    execEndYear,
    selectedCountry,
    execVariationPct,
    execIntensity
  ]);

  const trendData = useMemo(() => {
    return dataFull
      .filter((d) => d.country === selectedCountry)
      .sort((a, b) => a.year - b.year)
      .map((d) => {
        const comp = dataFull.find((c) => c.year === d.year && c.country === compareCountry);
        return {
          year: d.year,
          co2: d.co2 ? Number(d.co2.toFixed(1)) : 0,
          compareCo2: comp?.co2 ? Number(comp.co2.toFixed(1)) : 0
        };
      });
  }, [dataFull, selectedCountry, compareCountry]);

  const execTrendData = useMemo(() => {
    return trendData.filter((d) => d.year >= execStartYear && d.year <= execEndYear);
  }, [trendData, execStartYear, execEndYear]);

  const intensityChartData = useMemo(() => {
    const names = top5Data.map((t) => t.country);
    const refYear = execEndYear === 2023 ? 2022 : execEndYear;
    return dataFull
      .filter((d) => d.year === refYear && names.includes(d.country) && d.gdp > 0 && d.co2 > 0)
      .map((d) => ({
        country: d.country,
        label: formatName(d.country),
        intensidad: Number((d.co2 / (d.gdp / 1e9)).toFixed(2))
      }))
      .sort((a, b) => b.intensidad - a.intensidad);
  }, [dataFull, top5Data, execEndYear]);

  const sectors = useMemo(() => {
    const items = [
      { name: 'Carbón', value: Number(execCurrentRecord.coal_co2 ?? 0), color: '#EF4444' },
      { name: 'Petróleo', value: Number(execCurrentRecord.oil_co2 ?? 0), color: '#F97316' },
      { name: 'Gas', value: Number(execCurrentRecord.gas_co2 ?? 0), color: '#10B981' },
      { name: 'Cemento', value: Number(execCurrentRecord.cement_co2 ?? 0), color: '#71717A' },
      { name: 'Flaring', value: Number(execCurrentRecord.flaring_co2 ?? 0), color: '#A855F7' }
    ];
    const total = items.reduce((acc, i) => acc + i.value, 0);
    return items.map((i) => ({
      ...i,
      pct: total > 0 ? ((i.value / total) * 100).toFixed(1) : '0.0'
    }));
  }, [execCurrentRecord]);

  const globalShareData = useMemo(() => {
    const validRows = execRangeData.filter((d) => d.co2 > 0);
    const totalWorld = validRows.reduce((acc, d) => acc + d.co2, 0);
    const top3 = top5Data.slice(0, 3);
    const top3Sum = top3.reduce((acc, d) => acc + d.co2, 0);

    const slices = top3.map((item) => ({
      name: item.label,
      value: item.co2,
      pct: totalWorld > 0 ? ((item.co2 / totalWorld) * 100).toFixed(1) : '0'
    }));

    if (totalWorld > top3Sum) {
      slices.push({
        name: 'Resto del mundo',
        value: Number((totalWorld - top3Sum).toFixed(1)),
        pct: (((totalWorld - top3Sum) / totalWorld) * 100).toFixed(1)
      });
    }
    return slices;
  }, [execRangeData, top5Data]);

  const simulationData = useMemo(() => {
    const base2023 = dataFull.find((d) => d.year === 2023 && d.country === selectedCountry);
    if (!base2023) return { series: [], savedMt: 0, finalCo2: 0 };

    const coalBase = Number(base2023.coal_co2 ?? 0);
    const oilBase = Number(base2023.oil_co2 ?? 0);
    const gasBase = Number(base2023.gas_co2 ?? 0);
    const otherBase = Number(base2023.cement_co2 ?? 0) + Number(base2023.flaring_co2 ?? 0);
    const totalBase = Number(base2023.co2 ?? coalBase + oilBase + gasBase + otherBase);

    const target2030 =
      coalBase * (1 - coalCutPct / 100) +
      oilBase * (1 - oilCutPct / 100) +
      gasBase * (1 - gasCutPct / 100) +
      otherBase;

    const series = [];
    for (let yr = 2023; yr <= 2030; yr++) {
      const step = (yr - 2023) / 7;
      series.push({
        year: yr,
        inercial: Number((totalBase * (1 + 0.008 * (yr - 2023))).toFixed(1)),
        simulado: Number((totalBase - (totalBase - target2030) * step).toFixed(1))
      });
    }

    return {
      series,
      savedMt: Math.max(0, totalBase - target2030).toFixed(1),
      finalCo2: target2030.toFixed(1)
    };
  }, [dataFull, selectedCountry, coalCutPct, oilCutPct, gasCutPct]);

  // Cálculos de la Calculadora ESG Corporativa (basada en datos reales del país)
  const esgCalculation = useMemo(() => {
    const countryFactor = currentRecord.co2_per_capita
      ? Math.max(0.25, currentRecord.co2_per_capita / 4.7)
      : 1.0;

    const officeTons = employeesCount * 1.4 * countryFactor;
    const energyTons = monthlyMwh * 12 * 0.42 * countryFactor;
    const fleetTons = fleetVehicles * 4.6;
    const totalTons = officeTons + energyTons + fleetTons;

    return {
      totalTons: totalTons.toFixed(1),
      treesNeeded: Math.ceil(totalTons * 45), // 1 árbol absorbe ~22 kg CO2/año
      carsEquivalent: Math.max(1, Math.round(totalTons / 4.6)),
      offsetUsd: Math.round(totalTons * 18), // Promedio $18 USD por bono de carbono
      breakdown: [
        { name: 'Operación Personal', value: Number(officeTons.toFixed(1)), fill: '#38BDF8' },
        { name: 'Consumo Eléctrico', value: Number(energyTons.toFixed(1)), fill: '#10B981' },
        { name: 'Flotilla Vehicular', value: Number(fleetTons.toFixed(1)), fill: '#F97316' }
      ]
    };
  }, [currentRecord, employeesCount, monthlyMwh, fleetVehicles]);

  const handleExportCSV = () => {
    const rowsToExport = activeView === 'table' ? yearData : dataFull;
    if (!rowsToExport.length) return;

    const headers = [
      'iso_code', 'country', 'year', 'population', 'gdp',
      'co2', 'co2_per_capita', 'coal_co2', 'oil_co2', 'gas_co2', 'cement_co2', 'flaring_co2'
    ];

    const csvLines = [
      headers.join(','),
      ...rowsToExport.map((row) =>
        headers.map((field) => `"${row[field] ?? ''}"`).join(',')
      )
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `emisiones_co2_${activeView === 'table' ? selectedYear : '2010_2023'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const execPeriodText =
    execStartYear === execEndYear ? `${execStartYear}` : `${execStartYear}–${execEndYear}`;

  if (showIntro) {
    return (
      <div className="landing-wrapper">
        <div className="landing-container">
          <div className="landing-topbar">
            <span className="exec-badge">
              <span className="pulse-dot" />
              Observatorio Global ESG • 2010–2023
            </span>
            <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
              {loading
                ? 'Sincronizando MariaDB...'
                : `${dataFull.length.toLocaleString('en-US')} registros verificados en MariaDB (${netMetrics.latencyMs} ms)`}
            </span>
          </div>

          <section className="hero-section">
            <span className="exec-badge">Inteligencia Climática y Eficiencia Económica</span>
            <h1>Monitoreo Estratégico de Emisiones Globales de CO₂</h1>
            <p>
              Plataforma analítica diseñada para evaluar el impacto ambiental, la{' '}
              <strong style={{ color: '#ffffff' }}>
                eficiencia energética por unidad de Producto Interno Bruto
              </strong>{' '}
              y la <strong style={{ color: '#ffffff' }}>transición industrial</strong> de{' '}
              <strong>218 países</strong> entre 2010 y 2023. Antes de ingresar al tablero,
              conoce los 6 conceptos clave que interpretan estos datos:
            </p>

            <div className="hero-actions">
              <button className="btn-primary-exec" onClick={() => setShowIntro(false)}>
                <span>Entrar al Dashboard Ejecutivo</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="btn-secondary-exec"
                onClick={() => {
                  setActiveView('esg_calc');
                  setShowIntro(false);
                }}
              >
                <Calculator size={16} />
                <span>Abrir Calculadora ESG</span>
              </button>
            </div>
          </section>

          <section className="concepts-grid">
            <div className="concept-card">
              <div className="concept-icon">
                <Flame size={20} color="#EF4444" />
              </div>
              <h3>1. ¿Qué es el CO₂ Absoluto?</h3>
              <p>
                Es el volumen total de dióxido de carbono que un país libera a la atmósfera en
                un año por quema de combustibles fósiles e industria. Sirve para identificar a
                los mayores emisores netos del planeta.
              </p>
              <div className="concept-formula">Unidad: Megatoneladas (Mt CO₂ / año)</div>
            </div>

            <div className="concept-card">
              <div className="concept-icon">
                <Zap size={20} color="#10B981" />
              </div>
              <h3>2. Eficiencia Energética por Unidad de PIB</h3>
              <p>
                Mide cuánta riqueza económica (Producto Interno Bruto) logra producir un país
                por cada unidad de energía y carbono consumido. Una economía altamente
                eficiente genera mayor crecimiento económico con menor gasto energético.
              </p>
              <div className="concept-formula">Relación: Valor Económico ($ PIB) vs. Energía</div>
            </div>

            <div className="concept-card">
              <div className="concept-icon">
                <Gauge size={20} color="#38BDF8" />
              </div>
              <h3>3. ¿Qué es la Intensidad de Carbono?</h3>
              <p>
                Traduce esa eficiencia energética a huella ambiental: indica exactamente
                cuántos kilogramos de CO₂ emite un país para generar $1,000 USD de PIB.
                Mientras más bajo sea este número, más limpia es su producción.
              </p>
              <div className="concept-formula">Fórmula: kg CO₂ / $1,000 USD PIB</div>
            </div>

            <div className="concept-card">
              <div className="concept-icon">
                <TrendingDown size={20} color="#A855F7" />
              </div>
              <h3>4. ¿Qué es la Transición Industrial?</h3>
              <p>
                Es el proceso estructural mediante el cual las industrias migran de
                combustibles altamente contaminantes (como el carbón) hacia fuentes más
                limpias (gas natural, energías renovables) y procesos de manufactura de bajas
                emisiones.
              </p>
              <div className="concept-formula">Indicador: Variación % (2010–2023) y mezcla</div>
            </div>

            <div className="concept-card">
              <div className="concept-icon">
                <Users size={20} color="#EAB308" />
              </div>
              <h3>5. ¿Qué mide el CO₂ Per Cápita?</h3>
              <p>
                Divide las emisiones totales de una nación entre su número de habitantes.
                Permite comparar de forma justa el impacto promedio de cada ciudadano entre
                países muy poblados y economías altamente industrializadas.
              </p>
              <div className="concept-formula">Unidad: Toneladas por habitante (t)</div>
            </div>

            <div className="concept-card">
              <div className="concept-icon">
                <Factory size={20} color="#F97316" />
              </div>
              <h3>6. Desglose por Fuente Industrial</h3>
              <p>
                Separa la huella nacional en 5 actividades clave: <strong>Carbón</strong>,{' '}
                <strong>Petróleo</strong>, <strong>Gas Natural</strong>, producción de{' '}
                <strong>Cemento</strong> y <strong>Flaring</strong> (quema de gas residual en
                extracción petrolera).
              </p>
              <div className="concept-formula">Participación porcentual (%) por sector</div>
            </div>
          </section>

          <footer className="arch-strip">
            <div>
              <strong style={{ color: '#ffffff' }}>Arquitectura de 3 Capas:</strong> Base de
              datos relacional MariaDB &rarr; API REST Node.js &rarr; Interfaz Analítica React.
            </div>
            <div>
              Fuente oficial:{' '}
              <a
                href="https://ourworldindata.org/grapher/co2-income-level"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#10b981',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>Our World in Data (CO₂ by Income Level)</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-box">
            <div className="brand-tag">Observatorio ESG</div>
            <div className="brand-title">Carbon Analytics</div>
            <div className="brand-author">Arquitectura 3 Capas • MariaDB</div>
          </div>

          <div className="nav-section-title">Inteligencia y Análisis</div>
          <nav className="nav-menu">
            <button
              className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <LayoutDashboard size={17} />
              <span>Vista Ejecutiva</span>
            </button>

            <button
              className={`nav-btn ${activeView === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveView('simulator')}
            >
              <Sliders size={17} />
              <span>Simulador 2030 (What-If)</span>
            </button>

            <button
              className={`nav-btn ${activeView === 'esg_calc' ? 'active' : ''}`}
              onClick={() => setActiveView('esg_calc')}
            >
              <Calculator size={17} />
              <span>Calculadora ESG</span>
            </button>

            <button
              className={`nav-btn ${activeView === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveView('compare')}
            >
              <GitCompare size={17} />
              <span>Comparativa Países</span>
            </button>
          </nav>

          <div className="nav-section-title">Datos y Documentación</div>
          <nav className="nav-menu">
            <button
              className={`nav-btn ${activeView === 'table' ? 'active' : ''}`}
              onClick={() => setActiveView('table')}
            >
              <Table2 size={17} />
              <span>Explorador SQL ({yearData.length})</span>
            </button>

            <button className="nav-btn" onClick={() => setShowIntro(true)}>
              <BookOpen size={17} />
              <span>Introducción y Guía</span>
            </button>
          </nav>

          <div className="sidebar-actions">
            <button className="btn-print" onClick={() => window.print()}>
              <Printer size={15} />
              <span>Reporte Ejecutivo (PDF)</span>
            </button>

            <button className="btn-export" onClick={handleExportCSV}>
              <Download size={15} />
              <span>Exportar CSV ({activeView === 'table' ? selectedYear : 'Completo'})</span>
            </button>
          </div>
        </div>

        <div className="network-card">
          <div className="network-header">
            <span>
              <Activity size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Estado de Red
            </span>
            <button
              onClick={fetchDatabase}
              title="Medir velocidad de respuesta"
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span className="status-pill">
              <span className="pulse-dot" />
              {netMetrics.status}
            </span>
          </div>

          <div className="net-metric-row">
            <span style={{ color: '#71717a' }}>Latencia API:</span>
            <strong style={{ color: netMetrics.latencyMs < 600 ? '#10B981' : '#F59E0B' }}>
              {netMetrics.latencyMs} ms
            </strong>
          </div>
          <div className="net-bar-bg">
            <div
              className="net-bar-fill"
              style={{
                width: `${Math.max(15, Math.min(100, 100 - netMetrics.latencyMs / 15))}%`
              }}
            />
          </div>

          <div className="net-metric-row">
            <span style={{ color: '#71717a' }}>Carga transferida:</span>
            <span>{netMetrics.payloadKb} KB</span>
          </div>
          <div className="net-metric-row" style={{ marginBottom: 0 }}>
            <span style={{ color: '#71717a' }}>Registros activos:</span>
            <span>{dataFull.length.toLocaleString('en-US')}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header-bar">
          <div className="header-title">
            <span>Observatorio de Carbono</span>
            <h1>
              Dashboard Interactivo de Emisiones de CO₂ (
              {activeView === 'overview' ? execPeriodText : '2010–2023'})
            </h1>
            <p>Análisis global • Perspectiva por país ({formatName(selectedCountry)})</p>
          </div>

          <div className="controls-bar">
            <div className="control-group">
              <label className="control-label">Búsqueda</label>
              <div className="search-wrapper">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar país o código ISO..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filteredCountries.length > 0 && (
                  <div className="search-dropdown">
                    {filteredCountries.map((item) => (
                      <div
                        key={item.iso_code}
                        className="search-option"
                        onClick={() => {
                          setSelectedCountry(item.country);
                          setSearchTerm('');
                          setShowDropdown(false);
                        }}
                      >
                        <span>
                          {formatName(item.country)} ({item.iso_code})
                        </span>
                        <span style={{ color: '#10b981' }}>
                          {item.co2 ? `${item.co2.toFixed(1)} Mt` : 'N/D'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {activeView === 'overview' ? (
              <>
                <div className="control-group">
                  <label className="control-label">Desde</label>
                  <select
                    className="filter-select"
                    value={execStartYear}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setExecStartYear(val);
                      if (val > execEndYear) setExecEndYear(val);
                    }}
                  >
                    {[...years].reverse().map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="control-group">
                  <label className="control-label">Hasta</label>
                  <select
                    className="filter-select"
                    value={execEndYear}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setExecEndYear(val);
                      if (val < execStartYear) setExecStartYear(val);
                    }}
                  >
                    {years.map((y) => (
                      <option key={y} value={y} disabled={y < execStartYear}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="control-group">
                <label className="control-label">Año</label>
                <select
                  className="filter-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="control-group">
              <label className="control-label">País</label>
              <select
                className="filter-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {formatName(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <section className="story-banner">
          <div className="story-text">
            <div className="story-tag">
              <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Diagnóstico Ejecutivo Automático
            </div>
            <p>{activeView === 'overview' ? execSummary : executiveSummary}</p>
          </div>
          <div className="macro-pills">
            <div className="macro-pill">
              <span>
                Población ({activeView === 'overview' ? execEndYear : selectedYear})
              </span>
              <strong>
                {formatLargeNumber(
                  activeView === 'overview'
                    ? execCurrentRecord.population
                    : currentRecord.population
                )}
              </strong>
            </div>
            <div className="macro-pill">
              <span>PIB Nacional (Ref.)</span>
              <strong>
                {formatLargeNumber(
                  activeView === 'overview' && execCurrentRecord.gdp
                    ? execCurrentRecord.gdp
                    : latestGdpRecord.gdp
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* VISTA 1: VISTA EJECUTIVA */}
        {activeView === 'overview' && (
          <>
            <section className="kpi-grid">
              <div className="card">
                <div className="kpi-label">
                  {execStartYear === execEndYear ? 'CO₂ Absoluto' : 'CO₂ Acumulado'}
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value" style={{ color: '#EF4444' }}>
                    {execCurrentRecord.co2
                      ? execCurrentRecord.co2.toLocaleString('en-US', {
                          maximumFractionDigits: 0
                        })
                      : '0'}
                  </span>
                  <span className="kpi-unit">Mt</span>
                </div>
                <div className="kpi-sub">
                  <span className="dot" style={{ background: '#EF4444', marginRight: 2 }} />
                  Emisiones totales • {formatName(selectedCountry)}, {execPeriodText}
                </div>
              </div>

              <div className="card">
                <div className="kpi-label">
                  {execStartYear === execEndYear ? 'CO₂ Per Cápita' : 'CO₂ Per Cápita (Prom.)'}
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value" style={{ color: '#ffffff' }}>
                    {execCurrentRecord.co2_per_capita
                      ? execCurrentRecord.co2_per_capita.toFixed(1)
                      : '0.0'}
                  </span>
                  <span className="kpi-unit">t</span>
                </div>
                <div className="kpi-sub">
                  <span className="dot" style={{ background: '#38BDF8', marginRight: 2 }} />
                  Toneladas por habitante
                </div>
              </div>

              <div className="card">
                <div className="kpi-label">Variación {execPeriodText}</div>
                <div className="kpi-value-row">
                  <span
                    className="kpi-value"
                    style={{ color: Number(execVariationPct) >= 0 ? '#F97316' : '#10B981' }}
                  >
                    {Number(execVariationPct) > 0
                      ? `+${execVariationPct}%`
                      : `${execVariationPct}%`}
                  </span>
                </div>
                <div className="kpi-sub">
                  <span className="dot" style={{ background: '#F97316', marginRight: 2 }} />
                  Transición acumulada del periodo
                </div>
              </div>

              <div className="card">
                <div className="kpi-label">Intensidad de Carbono</div>
                <div className="kpi-value-row">
                  <span className="kpi-value" style={{ color: '#10B981' }}>
                    {execIntensity}
                  </span>
                  <span className="kpi-unit">kg/$1K GDP</span>
                </div>
                <div className="kpi-sub">
                  <span className="dot" style={{ background: '#10B981', marginRight: 2 }} />
                  CO₂ por unidad de PIB ({execEndYear})
                </div>
              </div>
            </section>

            <section className="card map-section">
              <div>
                <div className="map-top-bar">
                  <div className="chart-header" style={{ marginBottom: 0 }}>
                    <h3>Mapa mundial de emisores</h3>
                    <p>
                      Vista global 2D • Principales países emisores de CO₂ • {execPeriodText}
                    </p>
                  </div>
                  <span className="badge-pill">MUNDO • {execPeriodText}</span>
                </div>

                <WorldMap
                  yearData={execRangeData}
                  top5Data={top5Data}
                  selectedCountry={selectedCountry}
                  onSelectCountry={(countryName) => setSelectedCountry(countryName)}
                />
              </div>

              <div>
                <div className="chart-header" style={{ marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: '#71717a',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    Ranking Dinámico
                  </span>
                  <h3>
                    {rankMode === 'emitters'
                      ? 'Mayores emisores'
                      : rankMode === 'reducers'
                      ? 'Líderes en reducción'
                      : 'Mayor intensidad'}
                  </h3>
                </div>

                <div className="rank-tabs">
                  <button
                    className={`rank-tab-btn ${rankMode === 'emitters' ? 'active' : ''}`}
                    onClick={() => setRankMode('emitters')}
                  >
                    Emisores
                  </button>
                  <button
                    className={`rank-tab-btn ${rankMode === 'reducers' ? 'active' : ''}`}
                    onClick={() => setRankMode('reducers')}
                  >
                    Reducción
                  </button>
                  <button
                    className={`rank-tab-btn ${rankMode === 'intensity' ? 'active' : ''}`}
                    onClick={() => setRankMode('intensity')}
                  >
                    Intensidad
                  </button>
                </div>

                <div className="emitter-rank-list">
                  {dynamicRankingList.map((item, idx) => (
                    <div
                      key={item.country}
                      className={`emitter-rank-item ${
                        selectedCountry === item.country ? 'active' : ''
                      }`}
                      onClick={() => setSelectedCountry(item.country)}
                    >
                      <div className="rank-left">
                        <span
                          className="rank-circle"
                          style={{
                            backgroundColor:
                              rankMode === 'reducers' ? '#10B981' : TOP_COLORS[idx]
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                            ISO: {item.iso}
                          </div>
                        </div>
                      </div>
                      <strong
                        style={{
                          fontSize: '0.92rem',
                          color: rankMode === 'reducers' ? '#10B981' : '#ffffff'
                        }}
                      >
                        {item.metricText}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="charts-row-2">
              <div className="card">
                <div className="chart-header">
                  <h3>Top 5 países emisores</h3>
                  <p>Emisiones de CO₂ • {execPeriodText}</p>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={top5Data} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" stroke="#52525b" fontSize={11} />
                    <YAxis
                      dataKey="label"
                      type="category"
                      stroke="#d4d4d8"
                      fontSize={12}
                      width={75}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#27272a',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="co2" name="Mt CO₂" radius={[0, 6, 6, 0]} barSize={18}>
                      {top5Data.map((entry, idx) => (
                        <Cell
                          key={entry.country}
                          fill={idx === 0 ? '#EF4444' : idx === 1 ? '#F97316' : '#52525B'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="chart-header">
                  <h3>Tendencia temporal de emisiones</h3>
                  <p>
                    {formatName(selectedCountry)} • {execPeriodText} (Mt CO₂)
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={execTrendData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="year" stroke="#52525b" fontSize={11} />
                    <YAxis stroke="#52525b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#27272a',
                        color: '#fff'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="co2"
                      name="Mt CO₂"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#co2Gradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="charts-row-3">
              <div className="card">
                <div className="chart-header">
                  <h3>Intensidad de carbono</h3>
                  <p>kg CO₂ / $1K GDP • Eficiencia económica</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={intensityChartData}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <XAxis type="number" stroke="#52525b" fontSize={11} />
                    <YAxis
                      dataKey="label"
                      type="category"
                      stroke="#d4d4d8"
                      fontSize={12}
                      width={75}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#27272a',
                        color: '#fff'
                      }}
                    />
                    <Bar
                      dataKey="intensidad"
                      name="kg CO₂ / $1K PIB"
                      radius={[0, 6, 6, 0]}
                      barSize={16}
                    >
                      {intensityChartData.map((entry) => (
                        <Cell
                          key={entry.country}
                          fill={entry.country === selectedCountry ? '#10B981' : '#52525B'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="chart-header">
                  <h3>Desglose sectorial</h3>
                  <p>
                    {formatName(selectedCountry)} • Transición por combustible, {execPeriodText}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#71717a'
                  }}
                >
                  <span>TOTAL CO₂</span>
                  <strong style={{ color: '#fff' }}>
                    {execCurrentRecord.co2
                      ? `${execCurrentRecord.co2.toLocaleString('en-US', {
                          maximumFractionDigits: 0
                        })} Mt`
                      : '0 Mt'}
                  </strong>
                </div>

                <div className="sector-bar-container">
                  {sectors.map((s) => (
                    <div
                      key={s.name}
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      title={`${s.name}: ${s.pct}%`}
                    />
                  ))}
                </div>

                <div className="sector-list">
                  {sectors.map((s) => (
                    <div key={s.name} className="sector-item">
                      <span>
                        <span className="dot" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                      <span>
                        <strong>{s.value.toFixed(0)} Mt</strong>{' '}
                        <span style={{ color: '#71717a', marginLeft: 8 }}>{s.pct}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="chart-header">
                  <h3>Participación global</h3>
                  <p>Distribución de las emisiones de CO₂ • {execPeriodText}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie
                        data={globalShareData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                      >
                        {globalShareData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n, p) => [`${v} Mt (${p.payload.pct}%)`, n]}
                        contentStyle={{
                          backgroundColor: '#000000',
                          borderColor: '#27272a',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    {globalShareData.map((item, idx) => (
                      <div key={item.name} style={{ fontSize: '0.8rem' }}>
                        <div style={{ color: '#a1a1aa' }}>
                          <span
                            className="dot"
                            style={{ backgroundColor: PIE_COLORS[idx] }}
                          />
                          {item.name}
                        </div>
                        <strong style={{ marginLeft: 17 }}>{item.pct}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* VISTA 2: SIMULADOR DE ESCENARIOS WHAT-IF */}
        {activeView === 'simulator' && (
          <section className="card">
            <div className="chart-header">
              <h3>Simulador Estratégico de Descarbonización (2024–2030)</h3>
              <p>
                Modela el impacto de reducir combustibles fósiles en {formatName(selectedCountry)}{' '}
                tomando como línea base sus emisiones reales de 2023
              </p>
            </div>

            <div className="sim-grid">
              <div>
                <div className="slider-box">
                  <div className="slider-header">
                    <span>Reducción de Carbón</span>
                    <strong style={{ color: '#EF4444' }}>-{coalCutPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={coalCutPct}
                    onChange={(e) => setCoalCutPct(Number(e.target.value))}
                    className="sim-slider"
                  />
                </div>

                <div className="slider-box">
                  <div className="slider-header">
                    <span>Reducción de Petróleo</span>
                    <strong style={{ color: '#F97316' }}>-{oilCutPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={oilCutPct}
                    onChange={(e) => setOilCutPct(Number(e.target.value))}
                    className="sim-slider"
                  />
                </div>

                <div className="slider-box">
                  <div className="slider-header">
                    <span>Reducción de Gas Natural</span>
                    <strong style={{ color: '#10B981' }}>-{gasCutPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={gasCutPct}
                    onChange={(e) => setGasCutPct(Number(e.target.value))}
                    className="sim-slider"
                  />
                </div>

                <div className="slider-box" style={{ borderColor: '#10B981' }}>
                  <div className="kpi-label">Ahorro Proyectado al 2030</div>
                  <div className="kpi-value" style={{ color: '#10B981', fontSize: '1.7rem' }}>
                    -{simulationData.savedMt} Mt CO₂
                  </div>
                  <div className="kpi-sub" style={{ marginTop: 6 }}>
                    Meta anual estimada: {simulationData.finalCo2} Mt
                  </div>
                </div>
              </div>

              <div>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={simulationData.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="year" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#27272a',
                        color: '#fff'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="inercial"
                      name="Tendencia Inercial (Sin cambios)"
                      stroke="#EF4444"
                      strokeDasharray="5 5"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="simulado"
                      name="Escenario Descarbonización"
                      stroke="#10B981"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* VISTA 3: CALCULADORA DE HUELLA CORPORATIVA Y COMPENSACIÓN ESG */}
        {activeView === 'esg_calc' && (
          <section className="card">
            <div className="chart-header">
              <h3>
                Calculadora de Huella Corporativa y Compensación Net-Zero •{' '}
                {formatName(selectedCountry)}
              </h3>
              <p>
                Estima las emisiones anuales de una empresa operando en{' '}
                {formatName(selectedCountry)} (ajustado a su índice real de CO₂ per cápita) y
                calcula cómo neutralizarlas
              </p>
            </div>

            <div className="sim-grid">
              <div>
                <div className="slider-box">
                  <div className="slider-header">
                    <span>Colaboradores en plantilla</span>
                    <strong style={{ color: '#38BDF8' }}>{employeesCount} personas</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="10"
                    value={employeesCount}
                    onChange={(e) => setEmployeesCount(Number(e.target.value))}
                    className="sim-slider"
                  />
                </div>

                <div className="slider-box">
                  <div className="slider-header">
                    <span>Consumo eléctrico mensual</span>
                    <strong style={{ color: '#10B981' }}>{monthlyMwh} MWh / mes</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={monthlyMwh}
                    onChange={(e) => setMonthlyMwh(Number(e.target.value))}
                    className="sim-slider"
                  />
                </div>

                <div className="slider-box">
                  <div className="slider-header">
                    <span>Flotilla de vehículos operativos</span>
                    <strong style={{ color: '#F97316' }}>{fleetVehicles} unidades</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={fleetVehicles}
                    onChange={(e) => setFleetVehicles(Number(e.target.value))}
                    className="sim-slider"
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 14,
                    marginBottom: 18
                  }}
                >
                  <div className="slider-box" style={{ marginBottom: 0 }}>
                    <div className="kpi-label">Huella Corporativa Anual</div>
                    <div className="kpi-value" style={{ color: '#EF4444', fontSize: '1.6rem' }}>
                      {esgCalculation.totalTons} t
                    </div>
                    <div className="kpi-sub" style={{ marginTop: 4 }}>
                      Toneladas de CO₂ / año
                    </div>
                  </div>

                  <div className="slider-box" style={{ marginBottom: 0 }}>
                    <div className="kpi-label">
                      <Trees size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Reforestación Necesaria
                    </div>
                    <div className="kpi-value" style={{ color: '#10B981', fontSize: '1.6rem' }}>
                      {esgCalculation.treesNeeded.toLocaleString('en-US')}
                    </div>
                    <div className="kpi-sub" style={{ marginTop: 4 }}>
                      Árboles adultos por año
                    </div>
                  </div>

                  <div className="slider-box" style={{ marginBottom: 0 }}>
                    <div className="kpi-label">
                      <Car size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Equivalencia Vehicular
                    </div>
                    <div className="kpi-value" style={{ color: '#38BDF8', fontSize: '1.6rem' }}>
                      {esgCalculation.carsEquivalent.toLocaleString('en-US')}
                    </div>
                    <div className="kpi-sub" style={{ marginTop: 4 }}>
                      Autos circulando 1 año
                    </div>
                  </div>

                  <div className="slider-box" style={{ marginBottom: 0 }}>
                    <div className="kpi-label">
                      <DollarSign
                        size={13}
                        style={{ verticalAlign: 'middle', marginRight: 4 }}
                      />
                      Bonos de Carbono
                    </div>
                    <div className="kpi-value" style={{ color: '#EAB308', fontSize: '1.6rem' }}>
                      ${esgCalculation.offsetUsd.toLocaleString('en-US')}
                    </div>
                    <div className="kpi-sub" style={{ marginTop: 4 }}>
                      Inversión Net-Zero (USD)
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={esgCalculation.breakdown}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <XAxis type="number" stroke="#52525b" fontSize={11} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#d4d4d8"
                      fontSize={12}
                      width={135}
                    />
                    <Tooltip
                      formatter={(val) => [`${val} Toneladas CO₂`, 'Emisión']}
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#27272a',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                      {esgCalculation.breakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* VISTA 4: COMPARATIVA DE PAÍSES */}
        {activeView === 'compare' && (
          <section className="card">
            <div className="map-top-bar">
              <div className="chart-header">
                <h3>Comparativa Histórica Directa (2010–2023)</h3>
                <p>
                  Compara la trayectoria de {formatName(selectedCountry)} frente a otro país
                </p>
              </div>
              <div className="control-group">
                <label className="control-label">Comparar contra</label>
                <select
                  className="filter-select"
                  value={compareCountry}
                  onChange={(e) => setCompareCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {formatName(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    borderColor: '#27272a',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="co2"
                  name={formatName(selectedCountry)}
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="compareCo2"
                  name={formatName(compareCountry)}
                  stroke="#F97316"
                  fill="#F97316"
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* VISTA 5: EXPLORADOR SQL */}
        {activeView === 'table' && (
          <section className="card">
            <div className="map-top-bar">
              <div className="chart-header">
                <h3>Explorador de Registros MariaDB • Año {selectedYear}</h3>
                <p>
                  Vista directa de vw_emisiones_completas ({yearData.length} países
                  registrados)
                </p>
              </div>
              <button
                className="btn-export"
                style={{ width: 'auto', marginTop: 0 }}
                onClick={handleExportCSV}
              >
                <Download size={15} /> Exportar tabla ({selectedYear})
              </button>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ISO</th>
                    <th>País</th>
                    <th>CO₂ Total (Mt)</th>
                    <th>Per Cápita (t)</th>
                    <th>Carbón</th>
                    <th>Petróleo</th>
                    <th>Gas</th>
                    <th>Cemento</th>
                  </tr>
                </thead>
                <tbody>
                  {yearData
                    .sort((a, b) => Number(b.co2 ?? 0) - Number(a.co2 ?? 0))
                    .map((row) => (
                      <tr
                        key={row.iso_code}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedCountry(row.country);
                          setActiveView('overview');
                        }}
                      >
                        <td>
                          <strong>{row.iso_code}</strong>
                        </td>
                        <td>{formatName(row.country)}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>
                          {row.co2 ? row.co2.toFixed(2) : 'N/D'}
                        </td>
                        <td>{row.co2_per_capita ? row.co2_per_capita.toFixed(2) : 'N/D'}</td>
                        <td>{row.coal_co2.toFixed(1)}</td>
                        <td>{row.oil_co2.toFixed(1)}</td>
                        <td>{row.gas_co2.toFixed(1)}</td>
                        <td>{row.cement_co2.toFixed(1)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}