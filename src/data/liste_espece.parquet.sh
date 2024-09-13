CODE="species"
URL="https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/structure/codelist/ESTAT/SPECIES/?compress=false&format=TSV&formatVersion=2.0"

# Use the data loader cache directory to store the downloaded data.
TMPDIR="src/.observablehq/cache/"

# Download the data (if it’s not already in the cache).
if [ ! -f "$TMPDIR/$CODE.tsv" ]; then
  curl "$URL" -o "$TMPDIR/$CODE.tsv"
fi

# Generate a Parquet file using DuckDB.
./duckdb :memory: << EOF
COPY (
  SELECT DISTINCT CODE, "Label - French"
  FROM read_csv('$TMPDIR/$CODE.tsv')
  ) TO STDOUT (FORMAT 'parquet');
EOF