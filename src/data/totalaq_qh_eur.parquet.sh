CODE="fish_aq_qh"
URL="https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/$CODE/?format=SDMX-CSV&i"

# Use the data loader cache directory to store the downloaded data.
TMPDIR="src/.observablehq/cache/"

# Download the data (if it’s not already in the cache).
if [ ! -f "$TMPDIR/$CODE.csv" ]; then
  curl "$URL" -o "$TMPDIR/$CODE.csv"
fi

# Generate a Parquet file using DuckDB.
./duckdb :memory: << EOF
COPY (
  WITH aggregated_data AS (
  SELECT species, TIME_PERIOD, sum(OBS_VALUE) as volume_total
  FROM read_csv('$TMPDIR/$CODE.csv', types={'fishreg': 'VARCHAR'})
  WHERE true
    AND species IN ('F10', 'F20', 'F30', 'F40', 'F50', 'F70', 'F90')
    AND unit = 'TLW'
    AND aquaenv = 'TOTAL'
    AND fishreg = '0'
    AND length(geo) = 2
    AND geo IN ('AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE')
  GROUP BY species, TIME_PERIOD
  )
  SELECT 
    TIME_PERIOD,
    SUM(CASE WHEN species IN ('F10','F20','F30')  THEN volume_total ELSE 0 END) AS 'Poissons',
    SUM(CASE WHEN species = 'F50' THEN volume_total ELSE 0 END) AS 'Mollusques',
    SUM(CASE WHEN species IN ('F40','F70','F90') THEN volume_total ELSE 0 END) AS 'Crustacés et plantes aquatiques',
  FROM aggregated_data
  GROUP BY TIME_PERIOD
  ORDER BY TIME_PERIOD
  ) TO STDOUT (FORMAT 'parquet', COMPRESSION 'gzip');
EOF