# Dashboard de Huella de Carbono Global (FASE 1)

## Información del Proyecto
- **Materia:** Visualización de Datos
- **Maestra:** Jessica Carmin Mendiola Fuentes
- **Carrera:** Ingeniería en Datos
- **Proyecto:** Dashboard Web - "¿Quién contamina más?"

---

## Integrantes
- **Daniel Armando González Castro**
- **Alexis de la Cruz Calderón**

---

## ¿De qué trata el proyecto?
Haremos una página web interactiva con **React** y **MariaDB** para ver qué países contaminan más en el mundo. Usaremos datos desde el año 2010 hasta el 2023 para comparar sus emisiones de dióxido de carbono (CO2), su población y su dinero (PIB).

---

## ¿Qué tipo de gráficos usará la página?

Para que la información sea muy fácil de entender, usaremos estos gráficos:

- **Gráfico de Barras:** Para mostrar el Top 5 de los países que más contaminan en el mundo.
- **Gráfico de Líneas:** Para ver si la contaminación de un país subió o bajó año por año (2010 a 2023).
- **Gráfico de Barras Apiladas:** Para ver cuánto contamina cada país según el tipo de industria (carbón, petróleo, gas o cemento).
- **Gráfico de Puntos (Dispersión):** Para comparar si los países con más dinero (PIB) son los que más contaminan.

---

## Resumen de los Datos Limpios

1. **Años analizados:** Del 2010 al 2023.
2. **Países incluidos:** 218 países en total.
3. **Limpieza de datos:** Se quitaron los continentes y los datos vacíos se rellenaron con 0.
4. **Países muy grandes:** Países como China y Estados Unidos contaminan demasiado comparados con los demás. No los borramos porque son los más importantes del proyecto; en su lugar, ajustamos los gráficos para que todos los países se puedan ver bien.

---

## Los Datos Más Importantes (Año 2023)

### Los 5 países que más contaminan:
1. **China:** 12,172 Mt
2. **Estados Unidos:** 4,918 Mt
3. **India:** 3,062 Mt
4. **Rusia:** 1,733 Mt
5. **Japón:** 986 Mt

### Los 3 países que más bajaron su contaminación (2010 vs 2023):
1. **Aruba:** Bajó un 64.6%
2. **Yemen:** Bajó un 60.7%
3. **Estonia:** Bajó un 53.9%

---

## Herramientas Usadas
- **Página Web:** React.js
- **Base de Datos:** MariaDB / MySQL
- **Limpieza de Datos:** Python (Google Colab)

---

## Enlaces
- **Documento en Google Docs:** [Documento_Justificacion_Fase1_Huella_Carbono](https://docs.google.com/document/d/1LWmoT7j8y1NFYTM4uoFFumASeIaoBhX7iqUp8RkPBUs/edit?usp=drive_web)
  - **Collab Realizado:** [Collab_Utilizado_en_el_Analisis](https://colab.research.google.com/drive/1YeWHqR-k6pBNn1kHQjeDWkPQzgNzvGCX?usp=sharing)
