"""
render_db.py — psycopg2 table-builder that mirrors the supabase-py query
interface, allowing trading_worker.py to use Render PostgreSQL transparently
when the DATABASE_URL env var is set.
"""
import json
import logging
import os
from typing import Any, Optional

import psycopg2
import psycopg2.extras

log = logging.getLogger("render-db")

DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

_conn: Optional[Any] = None


def _get_conn():
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL)
        _conn.autocommit = True
    return _conn


class _Result:
    __slots__ = ("data", "error")
    def __init__(self, data=None, error=None):
        self.data = data
        self.error = error


class _TableBuilder:
    def __init__(self, name: str):
        self._name = name
        self._op: Optional[str] = None
        self._cols = "*"
        self._where: list[tuple[str, Any]] = []
        self._payload: dict[str, Any] = {}
        self._order_col: Optional[str] = None
        self._order_asc: bool = True
        self._limit_n: Optional[int] = None

    def select(self, cols: str = "*") -> "_TableBuilder":
        self._op = "select"
        self._cols = cols
        return self

    def eq(self, col: str, val: Any) -> "_TableBuilder":
        self._where.append((col, val))
        return self

    def order(self, col: str, *, ascending: bool = True) -> "_TableBuilder":
        self._order_col = col
        self._order_asc = ascending
        return self

    def limit(self, n: int) -> "_TableBuilder":
        self._limit_n = n
        return self

    def insert(self, payload: dict) -> "_TableBuilder":
        self._op = "insert"
        self._payload = payload
        return self

    def update(self, payload: dict) -> "_TableBuilder":
        self._op = "update"
        self._payload = payload
        return self

    def execute(self) -> _Result:
        try:
            conn = _get_conn()
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                return self._run(cur)
        except psycopg2.OperationalError:
            global _conn
            _conn = None
            conn = _get_conn()
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                return self._run(cur)

    def _run(self, cur) -> _Result:
        tbl = f"public.{self._name}"

        if self._op == "select":
            where_sql, vals = self._build_where()
            sql = f"SELECT {self._cols} FROM {tbl}{where_sql}"
            if self._order_col:
                direction = "ASC" if self._order_asc else "DESC"
                sql += f" ORDER BY {self._order_col} {direction}"
            if self._limit_n:
                sql += f" LIMIT {self._limit_n}"
            cur.execute(sql, vals)
            rows = [dict(r) for r in cur.fetchall()]
            return _Result(data=rows)

        elif self._op == "insert":
            keys = list(self._payload.keys())
            vals = [
                json.dumps(v) if isinstance(v, (dict, list)) else v
                for v in self._payload.values()
            ]
            ph = ",".join(["%s"] * len(keys))
            sql = f"INSERT INTO {tbl} ({','.join(keys)}) VALUES ({ph})"
            try:
                cur.execute(sql, vals)
                return _Result(data=None, error=None)
            except Exception as exc:
                return _Result(data=None, error=str(exc))

        elif self._op == "update":
            where_sql, where_vals = self._build_where()
            keys = list(self._payload.keys())
            set_vals = [
                json.dumps(v) if isinstance(v, (dict, list)) else v
                for v in self._payload.values()
            ]
            set_clause = ",".join(f"{k}=%s" for k in keys)
            sql = f"UPDATE {tbl} SET {set_clause}{where_sql}"
            try:
                cur.execute(sql, set_vals + where_vals)
                return _Result(data=None, error=None)
            except Exception as exc:
                return _Result(data=None, error=str(exc))

        return _Result(error="Unknown operation")

    def _build_where(self) -> tuple[str, list]:
        if not self._where:
            return "", []
        clause = " AND ".join(f"{c}=%s" for c, _ in self._where)
        vals = [v for _, v in self._where]
        return f" WHERE {clause}", vals


def table(name: str) -> _TableBuilder:
    return _TableBuilder(name)
