"""
실패없는 카페 선택 — Firebase 데이터 추출 스크립트
출력: sessions.json/csv, sessions_v2.json/csv, cbti_sessions.json/csv

핵심 수정:
- created_at: Firestore 네이티브 Timestamp → KST 변환 (하루치만 나오던 버그 수정)
- utm=admin 세션은 is_admin=True 로 표시, JSON/CSV엔 포함하되 분석에서 제외
"""

import json
import csv
from datetime import datetime, timezone, timedelta
from collections import Counter

import firebase_admin
from firebase_admin import credentials, firestore

# ── Firebase 연결 ──────────────────────────────────────────────────────────
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

KST = timezone(timedelta(hours=9))

# ── Timestamp 파싱 (핵심 수정) ─────────────────────────────────────────────
def parse_ts(ts):
    """
    Firestore DatetimeWithNanoseconds / datetime / ISO문자열 → KST datetime
    저번 버그: 이벤트 배열 안 timestamp(ISO str)만 읽어서 날짜 집계 누락
    수정: created_at Firestore Timestamp 객체를 직접 변환
    """
    if ts is None:
        return None
    try:
        # Firestore Timestamp 객체 (DatetimeWithNanoseconds)
        if hasattr(ts, 'seconds'):
            return datetime.fromtimestamp(ts.seconds, tz=timezone.utc).astimezone(KST)
        # Python datetime
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            return ts.astimezone(KST)
        # ISO 문자열 fallback
        if isinstance(ts, str):
            return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(KST)
    except Exception as e:
        print(f"  ⚠️  ts 파싱 실패: {repr(ts)[:60]} → {e}")
    return None

def fmt(dt):
    """datetime → 'YYYY-MM-DD HH:MM:SS' KST 문자열"""
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else ""

def safe_len(v):
    return len(v) if isinstance(v, list) else 0

# ══════════════════════════════════════════════════════════════════════════
# 1. 데이터 수집
# ══════════════════════════════════════════════════════════════════════════
print("📥 Firebase에서 데이터 수집 중...\n")

collections = {
    "sessions":      {},
    "sessions_v2":   {},
    "cbti_sessions": {},
}

for col_name in collections:
    docs = list(db.collection(col_name).stream())
    collections[col_name] = {doc.id: doc.to_dict() for doc in docs}
    print(f"  ✅ {col_name}: {len(collections[col_name])}개 문서")

print()

# ══════════════════════════════════════════════════════════════════════════
# 2. JSON 저장 (created_at을 KST 문자열로 직렬화)
# ══════════════════════════════════════════════════════════════════════════
def serialize(obj):
    if hasattr(obj, 'seconds'):  # Firestore Timestamp
        dt = datetime.fromtimestamp(obj.seconds, tz=timezone.utc).astimezone(KST)
        return dt.strftime("%Y-%m-%d %H:%M:%S KST")
    if isinstance(obj, datetime):
        return fmt(obj.astimezone(KST) if obj.tzinfo else obj.replace(tzinfo=timezone.utc).astimezone(KST))
    return str(obj)

for col_name, data in collections.items():
    path = f"{col_name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=serialize)
    print(f"  💾 {path} 저장")

print()

# ══════════════════════════════════════════════════════════════════════════
# 3. CSV 생성
# ══════════════════════════════════════════════════════════════════════════

# ── sessions ──────────────────────────────────────────────────────────────
sessions_rows = []
for sid, s in collections["sessions"].items():
    created_kst = fmt(parse_ts(s.get("created_at")))
    is_admin    = (s.get("utm") == "admin")
    sessions_rows.append({
        "session_id":         sid,
        "created_at_kst":     created_kst,
        "date":               created_kst[:10],
        "hour":               created_kst[11:13],
        "device":             s.get("device", ""),
        "source":             s.get("source", ""),
        "utm":                s.get("utm") or "",
        "cbti_type":          s.get("cbti_type") or "",
        "landing_url":        s.get("landing_url") or "",
        "referer":            s.get("referer") or "",
        "n_cafe_clicks":      safe_len(s.get("cafe_clicks")),
        "n_direction_clicks": safe_len(s.get("direction_clicks")),
        "n_map_clicks":       safe_len(s.get("map_clicks")),
        "n_filter_clicks":    safe_len(s.get("filter_clicks")),
        "n_share_clicks":     safe_len(s.get("share_clicks")),
        "n_feedback":         safe_len(s.get("feedback_events")),
        "is_admin":           is_admin,
    })

sessions_rows.sort(key=lambda r: r["created_at_kst"])

with open("sessions.csv", "w", newline="", encoding="utf-8-sig") as f:
    if sessions_rows:
        w = csv.DictWriter(f, fieldnames=sessions_rows[0].keys())
        w.writeheader()
        w.writerows(sessions_rows)
print(f"  💾 sessions.csv ({len(sessions_rows)}행)")

# ── sessions_v2 ───────────────────────────────────────────────────────────
# 구조: sessions와 동일하게 각 이벤트가 전용 배열에 저장됨
# (cafe_clicks, map_clicks, direction_clicks, filter_clicks, share_clicks)
# interactions 배열은 enter_list 등 별도 이벤트 전용
sessions_v2_rows = []
for sid, s in collections["sessions_v2"].items():
    created_kst  = fmt(parse_ts(s.get("created_at")))
    is_admin     = (s.get("utm") == "admin")

    # interactions: enter_list 등 별도 이벤트
    interactions = s.get("interactions") or []
    inter_counts = Counter(
        i.get("event") for i in interactions if isinstance(i, dict)
    )

    # 각 전용 배열에서 직접 카운트 (sessions와 동일 구조)
    cafe_clicks      = s.get("cafe_clicks")      or []
    direction_clicks = s.get("direction_clicks") or []
    map_clicks       = s.get("map_clicks")       or []
    filter_clicks    = s.get("filter_clicks")    or []
    share_clicks     = s.get("share_clicks")     or []

    sessions_v2_rows.append({
        "session_id":          sid,
        "created_at_kst":      created_kst,
        "date":                created_kst[:10],
        "hour":                created_kst[11:13],
        "device":              s.get("device", ""),
        "source":              s.get("source", ""),
        "utm":                 s.get("utm") or "",
        "cbti_type":           s.get("cbti_type") or "",
        "landing_url":         s.get("landing_url") or "",
        "referer":             s.get("referer") or "",
        "app_version":         s.get("app_version") or "v2",
        "n_cafe_clicks":       len(cafe_clicks),
        "n_direction_clicks":  len(direction_clicks),
        "n_map_clicks":        len(map_clicks),
        "n_filter_clicks":     len(filter_clicks),
        "n_share_clicks":      len(share_clicks),
        "n_search_queries":    safe_len(s.get("search_queries")),
        "n_enter_list":        inter_counts.get("enter_list", 0),
        "n_feedback":          safe_len(s.get("feedback_events")),
        "is_admin":            is_admin,
    })

sessions_v2_rows.sort(key=lambda r: r["created_at_kst"])

with open("sessions_v2.csv", "w", newline="", encoding="utf-8-sig") as f:
    if sessions_v2_rows:
        w = csv.DictWriter(f, fieldnames=sessions_v2_rows[0].keys())
        w.writeheader()
        w.writerows(sessions_v2_rows)
print(f"  💾 sessions_v2.csv ({len(sessions_v2_rows)}행)")

# ── cbti_sessions ─────────────────────────────────────────────────────────
cbti_rows = []
for sid, s in collections["cbti_sessions"].items():
    created_kst = fmt(parse_ts(s.get("created_at")))
    is_admin    = (s.get("utm") == "admin")
    cbti_rows.append({
        "session_id":      sid,
        "created_at_kst":  created_kst,
        "date":            created_kst[:10],
        "hour":            created_kst[11:13],
        "device":          s.get("device", ""),
        "utm":             s.get("utm") or "",
        "uid":             s.get("uid") or "",
        "result_type":     s.get("result_type") or "",
        "finished":        s.get("finished", False),
        "clicked_service": s.get("clicked_service", False),
        "is_admin":        is_admin,
    })

cbti_rows.sort(key=lambda r: r["created_at_kst"])

with open("cbti_sessions.csv", "w", newline="", encoding="utf-8-sig") as f:
    if cbti_rows:
        w = csv.DictWriter(f, fieldnames=cbti_rows[0].keys())
        w.writeheader()
        w.writerows(cbti_rows)
print(f"  💾 cbti_sessions.csv ({len(cbti_rows)}행)")

# ══════════════════════════════════════════════════════════════════════════
# 4. 간단 검증 출력 (admin 제외 기준)
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*55)
print("  데이터 검증 요약 (utm=admin 제외)")
print("="*55)

# sessions
s_real = [r for r in sessions_rows     if not r["is_admin"]]
v_real = [r for r in sessions_v2_rows  if not r["is_admin"]]
c_real = [r for r in cbti_rows         if not r["is_admin"]]

print(f"\n  sessions:      전체 {len(sessions_rows)}개  →  분석 대상 {len(s_real)}개  (admin 제외 {len(sessions_rows)-len(s_real)}개)")
print(f"  sessions_v2:   전체 {len(sessions_v2_rows)}개  →  분석 대상 {len(v_real)}개  (admin 제외 {len(sessions_v2_rows)-len(v_real)}개)")
print(f"  cbti_sessions: 전체 {len(cbti_rows)}개  →  분석 대상 {len(c_real)}개  (admin 제외 {len(cbti_rows)-len(c_real)}개)")

# 날짜 분포 확인 (수정된 파싱 검증)
print("\n  [sessions_v2 날짜별 분포] ← 저번에 이게 하루치만 나왔던 필드")
date_dist = Counter(r["date"] for r in v_real if r["date"])
for d in sorted(date_dist):
    bar = "█" * date_dist[d]
    print(f"    {d}  {bar}  {date_dist[d]}개")

print("\n  [cbti_sessions 날짜별 분포]")
cbti_date = Counter(r["date"] for r in c_real if r["date"])
for d in sorted(cbti_date):
    bar = "█" * cbti_date[d]
    print(f"    {d}  {bar}  {cbti_date[d]}개")

print("\n  [sessions_v2 UTM 분포]")
for utm, cnt in Counter(r["utm"] for r in v_real).most_common():
    label = utm if utm else "(없음)"
    print(f"    {label:<15} {cnt}개")

print("\n✅ 완료! 총 6개 파일 생성 (json×3, csv×3)")
print("   날짜 분포가 정상적으로 여러 날에 걸쳐 나오면 파싱 버그 수정 확인 완료")

# 버그 수정 검증 추가
print("\n  [sessions_v2 이벤트 합계] ← 버그 수정 확인")
for col in ["n_cafe_clicks","n_direction_clicks","n_map_clicks","n_filter_clicks","n_share_clicks","n_search_queries"]:
    total = sum(r[col] for r in v_real)
    has   = sum(1 for r in v_real if r[col] > 0)
    print(f"    {col:<22}: 총 {total}회 / {has}세션")

print("\n  [통합 이벤트 합계 (sessions + sessions_v2, admin 제외)]")
all_rows = s_real + v_real
for col in ["n_cafe_clicks","n_direction_clicks","n_map_clicks","n_filter_clicks","n_share_clicks"]:
    total = sum(r.get(col, 0) for r in all_rows)
    has   = sum(1 for r in all_rows if r.get(col, 0) > 0)
    pct   = has / len(all_rows) * 100 if all_rows else 0
    print(f"    {col:<22}: 총 {total}회 / {has}세션 ({pct:.1f}%)")