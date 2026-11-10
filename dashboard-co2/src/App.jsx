import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

function App() {
  const [dataFull, setDataFull] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('China');
  const [top5Data, setTop5Data] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [intensityData, setIntensityData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [kpis, setKpis] = useState({
    mainCo2: '0',
    mainCountry: '',
    perCapita: 0,
    variation: 0,
    top5Share: 0
  });

  useEffect(() => {
    Papa.parse('/co2_limpio_2010_2023.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const cleanData = results.data.filter(row => row.year && row.country);
        setDataFull(cleanData);

        // 1. KPI Principal & Top 5 Emisores (2023)
        const datos2023 = cleanData
          .filter(row => row.year === 2023 && row.co2 > 0)
          .sort((a, b) => b.co2 - a.co2);

        const top5 = datos2023.slice(0, 5);
        setTop5Data(top5);

        const totalWorld2023 = datos2023.reduce((acc, curr) => acc + (curr.co2 || 0), 0);
        const top5Total = top5.reduce((acc, curr) => acc + (curr.co2 || 0), 0);
        const top5Share = totalWorld2023 > 0 ? ((top5Total / totalWorld2023) * 100).toFixed(1) : 0;

        // KPI 5: Gráfico 5 de Anillo Desglosado por País
        const pieDesglosado = top5.map(item => ({
          name: item.country,
          value: parseFloat(item.co2.toFixed(1))
        }));
        pieDesglosado.push({
          name: 'Resto del Mundo',
          value: parseFloat((totalWorld2023 - top5Total).toFixed(1))
        });
        setPieData(pieDesglosado);

        // KPI 4: Gráfico 4 - Intensidad de Carbono (kg CO2 por cada 1,000 USD de PIB - Año 2022)
        const datos2022 = cleanData.filter(row => row.year === 2022 && row.gdp > 0 && row.co2 > 0);
        const top5CountriesNames = top5.map(t => t.country);
        
        const intensityTop5 = datos2022
          .filter(row => top5CountriesNames.includes(row.country))
          .map(row => ({
            country: row.country,
            intensidad: parseFloat(((row.co2 / (row.gdp / 1e9)) * 1000).toFixed(1)) // kg CO2 por 1,000 USD PIB
          }))
          .sort((a, b) => b.intensidad - a.intensidad);

        setIntensityData(intensityTop5);

        // Cargar datos iniciales
        if (top5.length > 0) {
          const top1 = top5[0];
          setKpis(prev => ({
            ...prev,
            mainCo2: top1.co2 ? top1.co2.toLocaleString() : '0',
            mainCountry: top1.country,
            top5Share: top5Share
          }));
        }
      }
    });
  }, []);

  // Actualizar gráficos al seleccionar país
  useEffect(() => {
    if (dataFull.length === 0) return;

    // KPI 2: Tendencia Histórica y Variación % (2010 - 2023)
    const countryHistory = dataFull
      .filter(row => row.country === selectedCountry && row.year >= 2010 && row.year <= 2023)
      .sort((a, b) => a.year - b.year);

    setTimeSeriesData(countryHistory);

    const val2010 = countryHistory.find(r => r.year === 2010)?.co2 || 0;
    const val2023 = countryHistory.find(r => r.year === 2023)?.co2 || 0;
    const varPct = val2010 > 0 ? (((val2023 - val2010) / val2010) * 100).toFixed(1) : 0;

    const row2023 = countryHistory.find(r => r.year === 2023);
    const perCap = row2023?.co2_per_capita ? row2023.co2_per_capita.toFixed(2) : 0;

    setKpis(prev => ({
      ...prev,
      perCapita: perCap,
      variation: varPct
    }));

    // KPI 3: Desglose Sectorial (2023)
    if (row2023) {
      setSectorData([{
        country: row2023.country,
        Carbón: row2023.coal_co2 || 0,
        Petróleo: row2023.oil_co2 || 0,
        Gas: row2023.gas_co2 || 0,
        Cemento: row2023.cement_co2 || 0,
        Flaring: row2023.flaring_co2 || 0
      }]);
    }
  }, [selectedCountry, dataFull]);

  // Colores visuales
  const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  return (
    <div style={{ backgroundColor: '#0F172A', color: '#F8FAFC', minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER Y NAVEGACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#F8FAFC' }}>Dashboard: Huella de Carbono Global</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '14px' }}>Visualización Táctica - Estratégica (2010–2023)</p>
        </div>
        <div>
          <label style={{ marginRight: '10px', fontSize: '14px', color: '#CBD5E1' }}>Seleccionar País: </label>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px' }}
          >
            {Array.from(new Set(dataFull.map(d => d.country))).sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TARJETAS DE KPIS SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        
        {/* KPI 1 (PRINCIPAL) */}
        <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>KPI 1: EMISIONES ABSOLUTAS (2023)</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', color: '#EF4444' }}>{kpis.mainCo2} Mt</h2>
          <small style={{ color: '#CBD5E1' }}>Máximo Emisor: {kpis.mainCountry}</small>
        </div>

        {/* KPI 2 (PER CÁPITA) */}
        <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>KPI 2: CO2 PER CÁPITA ({selectedCountry})</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', color: '#10B981' }}>{kpis.perCapita} t/hab</h2>
          <small style={{ color: '#CBD5E1' }}>Toneladas por habitante (2023)</small>
        </div>

        {/* KPI 3 (VARIACIÓN HISTÓRICA) */}
        <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${kpis.variation <= 0 ? '#10B981' : '#F97316'}` }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>VARIACIÓN % (2010 - 2023)</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', color: kpis.variation <= 0 ? '#10B981' : '#F97316' }}>
            {kpis.variation > 0 ? `+${kpis.variation}%` : `${kpis.variation}%`}
          </h2>
          <small style={{ color: '#CBD5E1' }}>Tendencia en {selectedCountry}</small>
        </div>

        {/* KPI 5 (CUOTA MUNDIAL) */}
        <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>KPI 5: CUOTA GLOBAL TOP 5</span>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', color: '#3B82F6' }}>{kpis.top5Share}%</h2>
          <small style={{ color: '#CBD5E1' }}>Del CO2 total del planeta</small>
        </div>

      </div>

      {/* SECCIÓN 1: GRÁFICOS PRINCIPALES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* GRÁFICO 1: Barras Horizontales */}
        <div style={{ background: '#1E293B', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#F8FAFC' }}>1. Top 5 Emisores Absolutos de CO2 (2023)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={top5Data} layout="vertical">
                <XAxis type="number" stroke="#94A3B8" />
                <YAxis dataKey="country" type="category" stroke="#94A3B8" width={95} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }} />
                <Bar dataKey="co2" fill="#EF4444" radius={[0, 4, 4, 0]} name="CO2 (Mt)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: Líneas Temporal */}
        <div style={{ background: '#1E293B', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#F8FAFC' }}>2. Tendencia Temporal de CO2: {selectedCountry} (2010–2023)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={timeSeriesData}>
                <XAxis dataKey="year" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }} />
                <Line type="monotone" dataKey="co2" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="CO2 (Mt)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* SECCIÓN 2: GRÁFICOS CLAROS Y EXPLICATIVOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* GRÁFICO 3: Barras Apiladas por Sector Industrial */}
        <div style={{ background: '#1E293B', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#F8FAFC' }}>3. Desglose Sectorial: {selectedCountry}</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={sectorData}>
                <XAxis dataKey="country" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }} />
                <Legend />
                <Bar dataKey="Carbón" stackId="a" fill="#EF4444" />
                <Bar dataKey="Petróleo" stackId="a" fill="#F97316" />
                <Bar dataKey="Gas" stackId="a" fill="#3B82F6" />
                <Bar dataKey="Cemento" stackId="a" fill="#94A3B8" />
                <Bar dataKey="Flaring" stackId="a" fill="#A855F7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 4 CORREGIDO: Intensidad de Carbono (kg CO2 por 1,000 USD de PIB) */}
        <div style={{ background: '#1E293B', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#F8FAFC' }}>4. Eficiencia: kg CO2 / $1,000 PIB</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={intensityData} layout="vertical">
                <XAxis type="number" stroke="#94A3B8" />
                <YAxis dataKey="country" type="category" stroke="#94A3B8" width={95} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }} />
                <Bar dataKey="intensidad" fill="#3B82F6" radius={[0, 4, 4, 0]} name="kg CO2 por $1,000 PIB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 5 CORREGIDO: Anillo Desglosado por País */}
        <div style={{ background: '#1E293B', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#F8FAFC' }}>5. Aporte Individual al CO2 Global</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

export default App;