import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const GEOJSON_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

const COUNTRY_COORDS = {
  CHN: [35.8, 104.1],
  USA: [39.8, -98.5],
  IND: [22.5, 79.0],
  RUS: [61.5, 95.0],
  JPN: [36.2, 138.2],
  IRN: [32.4, 53.6],
  DEU: [51.1, 10.4],
  SAU: [23.8, 45.0],
  IDN: [-2.5, 118.0],
  KOR: [36.5, 127.8],
  CAN: [56.1, -106.3],
  BRA: [-10.0, -52.0],
  MEX: [23.6, -102.5]
};

const TOP_COLORS = ['#EF4444', '#F97316', '#EAB308', '#F472B6', '#A855F7'];

export default function WorldMap({ yearData, top5Data, selectedCountry, onSelectCountry }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [worldGeoJson, setWorldGeoJson] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((geo) => setWorldGeoJson(geo))
      .catch((err) => console.error('Error cargando GeoJSON:', err));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [24, 12],
      zoom: 1.8,
      minZoom: 1.5,
      maxZoom: 6,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!worldGeoJson) return;

    if (geoJsonLayerRef.current) geoJsonLayerRef.current.remove();
    if (markersLayerRef.current) markersLayerRef.current.remove();

    const byIso = {};
    yearData.forEach((d) => {
      if (d.iso_code) byIso[d.iso_code.toUpperCase()] = d;
    });

    const topRankByIso = {};
    top5Data.forEach((item, index) => {
      if (item.iso) topRankByIso[item.iso.toUpperCase()] = index;
    });

    const getColor = (iso, isSelected) => {
      if (iso in topRankByIso) {
        return TOP_COLORS[topRankByIso[iso]];
      }
      if (isSelected) return '#38BDF8';
      return '#27272A';
    };

    const layer = L.geoJSON(worldGeoJson, {
      style: (feature) => {
        const iso = feature.id;
        const record = byIso[iso];
        const isSelected = record?.country === selectedCountry;
        const isTop = iso in topRankByIso;
        return {
          fillColor: getColor(iso, isSelected),
          weight: isSelected ? 2 : 0.7,
          opacity: 1,
          color: isSelected ? '#38BDF8' : '#000000',
          fillOpacity: isTop ? 0.92 : isSelected ? 0.92 : 0.85
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const iso = feature.id;
        const record = byIso[iso];
        const name = record ? record.country : feature.properties.name;
        const co2Text = record?.co2
          ? `${record.co2.toLocaleString('en-US', { maximumFractionDigits: 1 })} Mt CO₂`
          : 'Sin registro';

        featureLayer.bindTooltip(`<strong>${name}</strong><br/>${co2Text}`, { sticky: true });

        featureLayer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, color: '#38BDF8' });
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
          },
          click: () => {
            if (record?.country) {
              onSelectCountry(record.country);
            }
          }
        });
      }
    }).addTo(map);

    geoJsonLayerRef.current = layer;

    const markersGroup = L.layerGroup();
    top5Data.forEach((item, idx) => {
      const coords = COUNTRY_COORDS[item.iso];
      if (coords) {
        const icon = L.divIcon({
          className: 'custom-map-pin',
          html: `<span>${idx + 1}</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        L.marker(coords, { icon, interactive: false }).addTo(markersGroup);
      }
    });
    markersGroup.addTo(map);
    markersLayerRef.current = markersGroup;
  }, [worldGeoJson, yearData, top5Data, selectedCountry, onSelectCountry]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height: '390px',
        width: '100%',
        borderRadius: '10px',
        backgroundColor: '#000000',
        border: '1px solid #1C1C1E',
        zIndex: 1
      }}
    />
  );
}