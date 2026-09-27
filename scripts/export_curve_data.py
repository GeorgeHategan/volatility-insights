#!/usr/bin/env python3
"""Export aligned VIX curve history for the static posture page."""

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = Path.home() / "dev/vix-dashboard/data/vix.duckdb"
DEFAULT_OUTPUT = ROOT / "curveposture/data.json"


def export(db_path: Path, output_path: Path) -> dict:
    connection = duckdb.connect(str(db_path), read_only=True)
    try:
        rows = connection.execute(
            """
            SELECT date,
                   max(close) FILTER (WHERE "index" = 'VIX') AS vix,
                   max(close) FILTER (WHERE "index" = 'VX30') AS vx30,
                   max(close) FILTER (WHERE "index" = 'VX60') AS vx60
            FROM index_daily
            WHERE "index" IN ('VIX', 'VX30', 'VX60')
            GROUP BY date
            HAVING vix IS NOT NULL AND vx30 IS NOT NULL AND vx60 IS NOT NULL
            ORDER BY date
            """
        ).fetchall()
    finally:
        connection.close()

    if not rows:
        raise ValueError("No overlapping VIX, VX30 and VX60 observations")

    observations = []
    for date, vix, vx30, vx60 in rows:
        values = (float(vix), float(vx30), float(vx60))
        if not all(math.isfinite(value) and value > 0 for value in values):
            raise ValueError(f"Invalid curve observation on {date}")
        observations.append([date.isoformat(), *[round(value, 6) for value in values]])

    payload = {
        "schema": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "columns": ["date", "vix", "vx30", "vx60"],
        "observations": observations,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(".tmp")
    temporary_path.write_text(
        json.dumps(payload, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(output_path)
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    payload = export(args.db, args.output)
    print(
        f"Exported {len(payload['observations']):,} observations to {args.output} "
        f"through {payload['observations'][-1][0]}"
    )


if __name__ == "__main__":
    main()