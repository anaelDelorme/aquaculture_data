CODE="fish_aq2a"
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
  SELECT DISTINCT TIME_PERIOD
  FROM read_csv('$TMPDIR/$CODE.csv', types={'fishreg': 'VARCHAR'})
  ) TO STDOUT (FORMAT 'parquet');
EOF