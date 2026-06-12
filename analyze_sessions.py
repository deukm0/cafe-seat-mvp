"""
실패없는 카페 선택 — PMF 분석 스크립트 (수정판)
사용법: python analyze_sessions.py
출력: 콘솔 리포트 + analysis_report.html
"""

import json
import re
from datetime import datetime, timezone, timedelta
from collections import defaultdict, Counter

import firebase_admin
from firebase_admin import credentials, firestore

# ── Firebase 연결 ─────────────────────────────────────────────────────────
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

KST = timezone(timedelta(hours=9))

def parse_to_kst(ts):
    """
    Firestore의 Datetime 객체 또는 ISO 문자열을 KST datetime으로 안전하게 변환
    """
    if not ts:
        return None
    try:
        # 1. 이미 Python datetime 객체인 경우 (firestore_admin이 자동 변환한 경우)
        if isinstance(ts, datetime):
            return ts.astimezone(KST)
        
        # 2. 문자열(ISO 포맷)인 경우
        if isinstance(ts, str):
            ts_str = ts.replace("Z", "+00:00")
            dt = datetime.fromisoformat(ts_str)
            return dt.astimezone(KST)
    except Exception:
        pass
    return None

# ── 데이터 수집 ───────────────────────────────────────────────────────────
print("📥 Firebase에서 데이터 수집 중...")

raw_sessions = {}
for doc in db.collection("sessions").stream():
    raw_sessions[doc.id] = doc.to_dict()

raw_cbti = {}
for doc in db.collection("cbti_sessions").stream():
    raw_cbti[doc.id] = doc.to_dict()

print(f"  sessions: {len(raw_sessions)}개")
print(f"  cbti_sessions: {len(raw_cbti)}개\n")

# JSON 백업 (에러 방지를 위해 datetime 객체를 문자열로 변환)
with open("sessions.json", "w", encoding="utf-8") as f:
    json.dump(raw_sessions, f, ensure_ascii=False, indent=2, default=str)
with open("cbti_sessions.json", "w", encoding="utf-8") as f:
    json.dump(raw_cbti, f, ensure_ascii=False, indent=2, default=str)

# ══════════════════════════════════════════════════════════════════════════
# 1. 메인 앱 세션 분석
# ══════════════════════════════════════════════════════════════════════════
sessions = list(raw_sessions.values())

total_sessions = len(sessions)

# 고유 유저 파악 (uid가 없으면 session_id 기준 - 재방문율 집계 한계 고려)
uids = [s.get("uid") or s.get("session_id") for s in sessions]
unique_users = len(set(uids))
uid_counts = Counter(uids)
returning_users = sum(1 for c in uid_counts.values() if c > 1)
returning_rate  = returning_users / unique_users * 100 if unique_users else 0

device_counts = Counter(s.get("device", "unknown") for s in sessions)
source_counts = Counter(s.get("source", "direct") for s in sessions)
utm_counts = Counter(s.get("utm") for s in sessions if s.get("utm"))

# ── 이벤트 행동 분석 ──────────────────────────────────────────────────────
cafe_click_sessions      = 0
direction_click_sessions = 0
filter_click_sessions    = 0
map_click_sessions       = 0
share_click_sessions     = 0

cafe_click_counts      = []
direction_click_counts = []

cafe_clicks_by_id      = Counter()
direction_clicks_by_id = Counter()
direction_by_status    = Counter() 

hour_dist = Counter()
day_dist  = Counter()
date_dist = Counter()

filter_values = Counter()
share_types = Counter()

for s in sessions:
    # 1. 시간대 및 일자 추이는 'created_at' 필드 기준
    created_dt = parse_to_kst(s.get("created_at"))
    if created_dt:
        hour_dist[created_dt.hour] += 1
        day_dist[created_dt.strftime("%a")] += 1
        date_dist[created_dt.strftime("%Y-%m-%d")] += 1

    # 2. 각 이벤트 배열 추출
    cafe_clicks      = s.get("cafe_clicks", []) or []
    direction_clicks = s.get("direction_clicks", []) or []
    filter_clicks    = s.get("filter_clicks", []) or []
    map_clicks       = s.get("map_clicks", []) or []
    share_clicks     = s.get("share_clicks", []) or []

    # 3. 세션 단위 카운트 (해당 이벤트를 1회라도 한 세션)
    if len(cafe_clicks) > 0:      cafe_click_sessions += 1
    if len(direction_clicks) > 0: direction_click_sessions += 1
    if len(filter_clicks) > 0:    filter_click_sessions += 1
    if len(map_clicks) > 0:       map_click_sessions += 1
    if len(share_clicks) > 0:     share_click_sessions += 1

    cafe_click_counts.append(len(cafe_clicks))
    direction_click_counts.append(len(direction_clicks))

    # 4. 상세 데이터 추출
    for c in cafe_clicks:
        if isinstance(c, dict) and c.get("cafe_id"):
            cafe_clicks_by_id[c["cafe_id"]] += 1

    for d in direction_clicks:
        if isinstance(d, dict):
            cid = d.get("cafe_id")
            csts = d.get("cafe_status")
            if cid:  direction_clicks_by_id[cid] += 1
            if csts: direction_by_status[csts] += 1

    for f in filter_clicks:
        if isinstance(f, dict) and f.get("filter_value"):
            filter_values[f["filter_value"]] += 1

    for sh in share_clicks:
        if isinstance(sh, dict):
            share_types[sh.get("share_type", "unknown")] += 1

# 이벤트 비율 계산 헬퍼
def pct(n, total):
    return f"{n/total*100:.1f}%" if total else "0%"

# ══════════════════════════════════════════════════════════════════════════
# 2. CBTI 세션 분석 (독립적인 DB로 간주)
# ══════════════════════════════════════════════════════════════════════════
cbti_sessions = list(raw_cbti.values())
total_cbti    = len(cbti_sessions)

cbti_result_dist = Counter(s.get("result_type") for s in cbti_sessions if s.get("result_type"))
cbti_completed = sum(1 for s in cbti_sessions if s.get("result_type"))
cbti_completion_rate = cbti_completed / total_cbti * 100 if total_cbti else 0

cbti_shared = sum(1 for s in cbti_sessions if s.get("shared"))
cbti_share_rate = cbti_shared / cbti_completed * 100 if cbti_completed else 0

# CBTI 전환은 소스 유입량으로만 추정
cbti_to_main = source_counts.get("cbti", 0) 
cbti_conversion_rate = cbti_to_main / cbti_completed * 100 if cbti_completed else 0

# ══════════════════════════════════════════════════════════════════════════
# 3. 핵심 PMF 지표 계산
# ══════════════════════════════════════════════════════════════════════════
direction_rate = direction_click_sessions / total_sessions * 100 if total_sessions else 0
avg_cafe_clicks = sum(cafe_click_counts) / total_sessions if total_sessions else 0
total_direction_clicks = sum(direction_click_counts)
passive_sessions = total_sessions - cafe_click_sessions
passive_rate = passive_sessions / total_sessions * 100 if total_sessions else 0

# ══════════════════════════════════════════════════════════════════════════
# 4. 콘솔 출력
# ══════════════════════════════════════════════════════════════════════════
DIVIDER = "=" * 60
SECTION = "-" * 40

def section(title):
    print(f"\n{SECTION}")
    print(f"  {title}")
    print(SECTION)

print(f"\n{DIVIDER}")
print("  실패없는 카페 선택 — PMF 분석 리포트")
print(f"  기준: {datetime.now(KST).strftime('%Y-%m-%d %H:%M')} KST")
print(DIVIDER)

section("1. 트래픽 기본 지표")
print(f"  총 세션 수:       {total_sessions:>6}개")
print(f"  유니크 방문:      {unique_users:>6}회 (session_id 기준)")
print(f"  재방문 세션:      {returning_users:>6}개 ({returning_rate:.1f}%)")

section("2. 유입 소스")
for src, cnt in source_counts.most_common():
    print(f"  {src:<15} {cnt:>4}개  ({pct(cnt, total_sessions)})")

section("3. 디바이스")
for dev, cnt in device_counts.most_common():
    print(f"  {dev:<10} {cnt:>4}개  ({pct(cnt, total_sessions)})")

section("4. 이벤트 행동 (메인 앱)")
print(f"  카페 카드 클릭:   {cafe_click_sessions:>4}세션  ({pct(cafe_click_sessions, total_sessions)}) — 관심 표현")
print(f"  지도 마커 클릭:   {map_click_sessions:>4}세션  ({pct(map_click_sessions, total_sessions)}) — 지도 활용")
print(f"  필터 사용:        {filter_click_sessions:>4}세션  ({pct(filter_click_sessions, total_sessions)}) — 능동 탐색")
print(f"  길찾기 클릭:      {direction_click_sessions:>4}세션  ({pct(direction_click_sessions, total_sessions)}) ⭐ 실사용 의도")
print(f"  공유:             {share_click_sessions:>4}세션  ({pct(share_click_sessions, total_sessions)}) — 바이럴")
print(f"\n  총 길찾기 클릭 수:    {total_direction_clicks}회")

if direction_by_status:
    print("\n  길찾기 클릭 - 혼잡도별:")
    for st, cnt in direction_by_status.most_common():
        print(f"    {st}  {cnt}회")

if filter_values:
    print("\n  필터 사용 패턴:")
    for fv, cnt in filter_values.most_common():
        print(f"    {fv}  {cnt}회")

section("5. 카페별 길찾기 TOP 5 ⭐ 실사용 의도")
for cid, cnt in direction_clicks_by_id.most_common(5):
    print(f"    {cid:<30} {cnt}회")

section("6. CBTI 퍼널 (독립 지표)")
print(f"  CBTI 세션 시작:   {total_cbti:>4}개")
print(f"  CBTI 완료:        {cbti_completed:>4}개  ({cbti_completion_rate:.1f}%)")
print(f"  CBTI → 메인 전환: {cbti_to_main:>4}개  (source 기반 추정)")

if cbti_result_dist:
    print("\n  CBTI 유형 분포:")
    for rtype, cnt in cbti_result_dist.most_common():
        print(f"    {rtype:<15} {cnt}명  ({pct(cnt, cbti_completed)})")

section("7. 시간대별 이용 패턴")
if hour_dist:
    for h in range(7, 24):
        bar = "█" * (hour_dist.get(h, 0) // max(1, max(hour_dist.values()) // 20))
        print(f"  {h:02d}시  {bar:<22} {hour_dist.get(h, 0)}")

section("8. PMF 종합 판단")
print(f"  ✅ 길찾기 클릭율:      {direction_rate:.1f}%")
print(f"  ✅ 필터 사용율:        {pct(filter_click_sessions, total_sessions)}")
print(f"  ✅ 공유율:             {pct(share_click_sessions, total_sessions)}")

print(f"\n{DIVIDER}")
print("  분석 완료. analysis_report.html 업데이트 완료.")
print(DIVIDER)

# ══════════════════════════════════════════════════════════════════════════
# 5. HTML 리포트 생성 (기존 유지, 변수만 조정)
# ══════════════════════════════════════════════════════════════════════════
def build_bar(val, max_val, width=120):
    if max_val == 0: return 0
    return int(val / max_val * width)

html_date_rows = ""
if date_dist:
    max_d = max(date_dist.values())
    for date in sorted(date_dist.keys()):
        w = build_bar(date_dist[date], max_d)
        html_date_rows += f"""<tr><td style="padding:4px 10px 4px 0;color:#666;font-size:13px;white-space:nowrap">{date}</td><td style="padding:4px 0"><div style="height:18px;width:{w}px;background:#6366f1;border-radius:3px;min-width:2px"></div></td><td style="padding:4px 0 4px 10px;color:#333;font-size:13px;font-weight:600">{date_dist[date]}</td></tr>"""

html_hour_rows = ""
if hour_dist:
    max_h = max(hour_dist.values())
    for h in range(7, 24):
        cnt = hour_dist.get(h, 0)
        w   = build_bar(cnt, max_h)
        html_hour_rows += f"""<tr><td style="padding:3px 10px 3px 0;color:#666;font-size:12px;white-space:nowrap">{h:02d}시</td><td style="padding:3px 0"><div style="height:16px;width:{w}px;background:#f59e0b;border-radius:3px;min-width:2px"></div></td><td style="padding:3px 0 3px 10px;color:#333;font-size:12px;font-weight:600">{cnt}</td></tr>"""

html_cafe_rows = ""
max_dc = max(direction_clicks_by_id.values()) if direction_clicks_by_id else 1
for cid, cnt in direction_clicks_by_id.most_common(10):
    w = build_bar(cnt, max_dc)
    html_cafe_rows += f"""<tr><td style="padding:5px 10px 5px 0;font-size:13px;color:#444;white-space:nowrap">{cid}</td><td style="padding:5px 0"><div style="height:18px;width:{w}px;background:#22c55e;border-radius:3px;min-width:2px"></div></td><td style="padding:5px 0 5px 10px;font-size:13px;font-weight:700;color:#22c55e">{cnt}</td></tr>"""

html_cbti_rows = ""
max_cr = max(cbti_result_dist.values()) if cbti_result_dist else 1
for rtype, cnt in cbti_result_dist.most_common():
    w = build_bar(cnt, max_cr)
    html_cbti_rows += f"""<tr><td style="padding:5px 10px 5px 0;font-size:13px;color:#444;white-space:nowrap">{rtype}</td><td style="padding:5px 0"><div style="height:18px;width:{w}px;background:#8b5cf6;border-radius:3px;min-width:2px"></div></td><td style="padding:5px 0 5px 10px;font-size:13px;font-weight:700;color:#8b5cf6">{cnt}</td></tr>"""

def pmf_badge(val, good, bad):
    if val >= good: color, label = "#22c55e", "✅ 양호"
    elif val >= bad: color, label = "#f59e0b", "⚠️ 보통"
    else: color, label = "#ef4444", "❌ 부족"
    return f'<span style="color:{color};font-weight:700">{label}</span>'

now_str = datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")

html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>실패없는 카페 선택 — PMF 분석 리포트</title>
<style>
  body {{ font-family: -apple-system, 'Pretendard', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; color: #1a1a1a; }}
  .wrap {{ max-width: 860px; margin: 0 auto; }}
  h1 {{ font-size: 22px; font-weight: 800; margin-bottom: 4px; }}
  .subtitle {{ font-size: 13px; color: #888; margin-bottom: 32px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 28px; }}
  .card {{ background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }}
  .card-big {{ background: #fff; border-radius: 14px; padding: 22px 24px; box-shadow: 0 1px 6px rgba(0,0,0,0.07); margin-bottom: 20px; }}
  .metric {{ font-size: 32px; font-weight: 800; line-height: 1; }}
  .metric-label {{ font-size: 12px; color: #888; margin-top: 6px; }}
  .metric-sub {{ font-size: 12px; color: #aaa; margin-top: 2px; }}
  h2 {{ font-size: 15px; font-weight: 700; margin: 0 0 16px; color: #1a1a1a; }}
  table {{ border-collapse: collapse; width: 100%; }}
  .funnel {{ display: flex; gap: 0; margin-bottom: 8px; }}
  .funnel-step {{ flex: 1; text-align: center; padding: 12px 8px; font-size: 13px; }}
  .funnel-step .num {{ font-size: 24px; font-weight: 800; }}
  .funnel-step .lbl {{ font-size: 11px; color: #888; margin-top: 3px; }}
  .arrow {{ display: flex; align-items: center; font-size: 18px; color: #ccc; padding: 0 4px; }}
  .pmf-row {{ display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }}
  .pmf-row:last-child {{ border-bottom: none; }}
  .pmf-label {{ font-size: 14px; color: #444; }}
  .pmf-val {{ font-size: 18px; font-weight: 800; }}
  .tag {{ display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }}
</style>
</head>
<body>
<div class="wrap">
  <h1>☕ 실패없는 카페 선택 — PMF 분석 리포트</h1>
  <div class="subtitle">기준: {now_str} &nbsp;|&nbsp; sessions: {total_sessions}개, cbti_sessions: {total_cbti}개</div>

  <div class="grid">
    <div class="card">
      <div class="metric" style="color:#6366f1">{total_sessions}</div>
      <div class="metric-label">총 방문 세션</div>
    </div>
    <div class="card">
      <div class="metric" style="color:#22c55e">{direction_click_sessions}</div>
      <div class="metric-label">길찾기 세션</div>
      <div class="metric-sub">실사용 의도 ⭐</div>
    </div>
    <div class="card">
      <div class="metric" style="color:#f59e0b">{pct(cafe_click_sessions, total_sessions)}</div>
      <div class="metric-label">탐색율</div>
      <div class="metric-sub">카드를 누른 비율</div>
    </div>
    <div class="card">
      <div class="metric" style="color:#ef4444">{total_cbti}</div>
      <div class="metric-label">CBTI 테스트</div>
    </div>
  </div>

  <div class="card-big">
    <h2>🎯 PMF 핵심 지표</h2>
    <div class="pmf-row">
      <div>
        <div class="pmf-label">길찾기 클릭율 <span class="tag" style="background:#f0fdf4;color:#22c55e">실사용 의도</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:2px">카페에 실제로 가려는 행동</div>
      </div>
      <div style="text-align:right">
        <div class="pmf-val" style="color:#22c55e">{direction_rate:.1f}%</div>
        <div>{pmf_badge(direction_rate, 20, 10)}</div>
      </div>
    </div>
    <div class="pmf-row">
      <div>
        <div class="pmf-label">필터 사용율 <span class="tag" style="background:#eff6ff;color:#6366f1">능동 탐색</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:2px">여유/보통/혼잡 필터링</div>
      </div>
      <div style="text-align:right">
        <div class="pmf-val" style="color:#6366f1">{pct(filter_click_sessions, total_sessions)}</div>
        <div>{pmf_badge(filter_click_sessions/total_sessions*100 if total_sessions else 0, 25, 10)}</div>
      </div>
    </div>
    <div class="pmf-row">
      <div>
        <div class="pmf-label">공유율 <span class="tag" style="background:#f0f9ff;color:#0ea5e9">바이럴</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:2px">카카오톡/링크 공유</div>
      </div>
      <div style="text-align:right">
        <div class="pmf-val" style="color:#0ea5e9">{pct(share_click_sessions, total_sessions)}</div>
        <div>{pmf_badge(share_click_sessions/total_sessions*100 if total_sessions else 0, 10, 3)}</div>
      </div>
    </div>
  </div>

  <div class="card-big">
    <h2>🧠 CBTI 퍼널 (독립 추이)</h2>
    <div class="funnel">
      <div class="funnel-step" style="background:#fdf4ff;border-radius:12px 0 0 12px">
        <div class="num" style="color:#8b5cf6">{total_cbti}</div>
        <div class="lbl">CBTI 시작</div>
      </div>
      <div class="arrow">→</div>
      <div class="funnel-step" style="background:#ede9fe">
        <div class="num" style="color:#7c3aed">{cbti_completed}</div>
        <div class="lbl">완료 ({cbti_completion_rate:.0f}%)</div>
      </div>
      <div class="arrow">→</div>
      <div class="funnel-step" style="background:#e0e7ff">
        <div class="num" style="color:#6366f1">{cbti_shared}</div>
        <div class="lbl">공유 ({cbti_share_rate:.0f}%)</div>
      </div>
      <div class="arrow">→</div>
      <div class="funnel-step" style="background:#eff6ff;border-radius:0 12px 12px 0">
        <div class="num" style="color:#3b82f6">{cbti_to_main}</div>
        <div class="lbl">메인 전환 유입</div>
      </div>
    </div>
    {"<table style='margin-top:16px'>" + html_cbti_rows + "</table>" if html_cbti_rows else ""}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div class="card-big">
      <h2>📍 길찾기 클릭 TOP 10 <span style="font-size:11px;color:#aaa;font-weight:400">실사용 의도</span></h2>
      {"<table>" + html_cafe_rows + "</table>" if html_cafe_rows else "<div style='color:#aaa;font-size:13px'>데이터 없음</div>"}
    </div>

    <div class="card-big">
      <h2>🚦 유입 소스</h2>
      <table>
      {"".join(f"<tr><td style='padding:5px 10px 5px 0;font-size:13px;color:#444'>{src}</td><td style='padding:5px 0;font-size:13px;font-weight:700'>{cnt}</td><td style='padding:5px 0 5px 8px;font-size:12px;color:#888'>{pct(cnt,total_sessions)}</td></tr>" for src, cnt in source_counts.most_common())}
      </table>
    </div>
  </div>

  <div class="card-big">
    <h2>⏰ 시간대별 이용 패턴 (세션 생성 기준)</h2>
    {"<table>" + html_hour_rows + "</table>" if html_hour_rows else "<div style='color:#aaa;font-size:13px'>데이터 없음</div>"}
  </div>

  <div style="margin-top:16px;font-size:11px;color:#ccc;text-align:center">
    실패없는 카페 선택 PMF 분석 | {now_str}
  </div>
</div>
</body>
</html>"""

with open("analysis_report.html", "w", encoding="utf-8") as f:
    f.write(html)