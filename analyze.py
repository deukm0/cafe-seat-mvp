"""
실패없는 카페 선택 — PMF 분석 리포트 생성
사전 조건: export_data.py 실행 후 sessions.csv, sessions_v2.csv, cbti_sessions.csv 생성된 상태
출력: analysis_report.html
"""

import pandas as pd
from collections import Counter
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
NOW = datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")

# ── 데이터 로드 ────────────────────────────────────────────────────────────
s  = pd.read_csv("sessions.csv")
v2 = pd.read_csv("sessions_v2.csv")
cb = pd.read_csv("cbti_sessions.csv")

# admin 제외
s_r  = s[~s["is_admin"]].copy()
v2_r = v2[~v2["is_admin"]].copy()
cb_r = cb[~cb["is_admin"]].copy()

# ── 기본 집계 ──────────────────────────────────────────────────────────────
total_main = len(s_r) + len(v2_r)
total_cbti = len(cb_r)

# 채널 합산
utm_all = pd.concat([s_r["utm"].fillna("(없음)"), v2_r["utm"].fillna("(없음)")]).value_counts()

# 날짜별 세션 (두 컬렉션 합산)
date_all = pd.concat([s_r["date"], v2_r["date"]]).value_counts().sort_index()

# 시간대별 (sessions_v2 기준 — 최근 데이터)
hour_v2 = v2_r["hour"].value_counts().sort_index()

# 행동 이벤트 (두 컬렉션 통합)
def ev_stats(col):
    s_total  = s_r[col].sum()  if col in s_r.columns  else 0
    v2_total = v2_r[col].sum() if col in v2_r.columns else 0
    s_sess   = (s_r[col] > 0).sum()  if col in s_r.columns  else 0
    v2_sess  = (v2_r[col] > 0).sum() if col in v2_r.columns else 0
    total    = s_total + v2_total
    sessions = s_sess + v2_sess
    pct      = sessions / total_main * 100 if total_main else 0
    return total, sessions, pct

cafe_total,   cafe_sess,   cafe_pct   = ev_stats("n_cafe_clicks")
dir_total,    dir_sess,    dir_pct    = ev_stats("n_direction_clicks")
map_total,    map_sess,    map_pct    = ev_stats("n_map_clicks")
filt_total,   filt_sess,   filt_pct   = ev_stats("n_filter_clicks")
share_total,  share_sess,  share_pct  = ev_stats("n_share_clicks")

# device
device_all = pd.concat([s_r["device"], v2_r["device"]]).value_counts()

# CBTI
cbti_completed   = cb_r["finished"].sum() if "finished" in cb_r.columns else len(cb_r)
cbti_converted   = cb_r["clicked_service"].sum() if "clicked_service" in cb_r.columns else 0
cbti_result_dist = cb_r["result_type"].value_counts() if "result_type" in cb_r.columns else pd.Series()
cbti_complete_pct  = cbti_completed / total_cbti * 100 if total_cbti else 0
cbti_convert_pct   = cbti_converted / cbti_completed * 100 if cbti_completed else 0

# CBTI UTM별 전환
cbti_utm_conv = cb_r.groupby(cb_r["utm"].fillna("(없음)"))["clicked_service"].agg(["sum","count"])
cbti_utm_conv.columns = ["전환", "총"]
cbti_utm_conv["전환율"] = (cbti_utm_conv["전환"] / cbti_utm_conv["총"] * 100).round(1)

# ── 헬퍼 ──────────────────────────────────────────────────────────────────
def bar_html(val, max_val, color, height=18, max_width=160):
    w = int(val / max_val * max_width) if max_val else 0
    return f'<div style="height:{height}px;width:{w}px;background:{color};border-radius:3px;min-width:2px;display:inline-block"></div>'

def pct_badge(val, good, warn):
    if val >= good:
        c, l = "#22c55e", "✅ 양호"
    elif val >= warn:
        c, l = "#f59e0b", "⚠️ 보통"
    else:
        c, l = "#ef4444", "❌ 부족"
    return f'<span style="color:{c};font-size:11px;font-weight:700">{l}</span>'

# ── HTML 조각 생성 ─────────────────────────────────────────────────────────

# 날짜별 바 차트
max_date = date_all.max() if len(date_all) else 1
date_rows_html = ""
for d, cnt in date_all.items():
    date_rows_html += f"""
    <tr>
      <td style="padding:4px 12px 4px 0;font-size:12px;color:#666;white-space:nowrap">{d}</td>
      <td style="padding:4px 4px">{bar_html(cnt, max_date, "#6366f1")}</td>
      <td style="padding:4px 0 4px 10px;font-size:13px;font-weight:700;color:#6366f1">{cnt}</td>
    </tr>"""

# 시간대별 바 차트 (sessions_v2)
max_hour = hour_v2.max() if len(hour_v2) else 1
hour_rows_html = ""
for h in range(0, 24):
    cnt = hour_v2.get(h, 0)
    if cnt == 0 and h < 7:
        continue
    hour_rows_html += f"""
    <tr>
      <td style="padding:3px 10px 3px 0;font-size:11px;color:#888;white-space:nowrap">{h:02d}시</td>
      <td style="padding:3px 4px">{bar_html(cnt, max_hour, "#f59e0b", 14, 140)}</td>
      <td style="padding:3px 0 3px 8px;font-size:12px;font-weight:600;color:#555">{cnt if cnt else ""}</td>
    </tr>"""

# 채널 바 차트
max_utm = utm_all.max() if len(utm_all) else 1
utm_rows_html = ""
utm_colors = {"everytime":"#22c55e","kakaotalk":"#f59e0b","(없음)":"#d1d5db","general_share":"#6366f1"}
for utm, cnt in utm_all.items():
    color = utm_colors.get(utm, "#94a3b8")
    pct = cnt / total_main * 100
    utm_rows_html += f"""
    <tr>
      <td style="padding:5px 12px 5px 0;font-size:13px;color:#444;white-space:nowrap">{utm}</td>
      <td style="padding:5px 4px">{bar_html(cnt, max_utm, color)}</td>
      <td style="padding:5px 0 5px 10px;font-size:13px;font-weight:700;color:#333">{cnt}</td>
      <td style="padding:5px 0;font-size:12px;color:#aaa">{pct:.1f}%</td>
    </tr>"""

# CBTI 결과 분포
max_cbti_r = cbti_result_dist.max() if len(cbti_result_dist) else 1
cbti_result_html = ""
cbti_colors = ["#8b5cf6","#6366f1","#ec4899","#f59e0b","#22c55e"]
for i, (rtype, cnt) in enumerate(cbti_result_dist.items()):
    color = cbti_colors[i % len(cbti_colors)]
    pct = cnt / cbti_completed * 100 if cbti_completed else 0
    cbti_result_html += f"""
    <tr>
      <td style="padding:5px 12px 5px 0;font-size:13px;color:#444;white-space:nowrap">{rtype}</td>
      <td style="padding:5px 4px">{bar_html(cnt, max_cbti_r, color)}</td>
      <td style="padding:5px 0 5px 8px;font-size:13px;font-weight:700" style="color:{color}">{cnt}명</td>
      <td style="padding:5px 0;font-size:12px;color:#aaa">{pct:.0f}%</td>
    </tr>"""

# CBTI UTM 전환 테이블
cbti_utm_html = ""
for utm, row in cbti_utm_conv.iterrows():
    cbti_utm_html += f"""
    <tr>
      <td style="padding:5px 12px 5px 0;font-size:12px;color:#666">{utm}</td>
      <td style="padding:5px 8px;font-size:13px;font-weight:700;text-align:center">{int(row['총'])}</td>
      <td style="padding:5px 8px;font-size:13px;font-weight:700;text-align:center;color:#6366f1">{int(row['전환'])}</td>
      <td style="padding:5px 0;font-size:12px;color:#888;text-align:center">{row['전환율']}%</td>
    </tr>"""

# 기간 계산
min_date = min(s_r["date"].min(), v2_r["date"].min(), cb_r["date"].min())
max_date_str = max(s_r["date"].max(), v2_r["date"].max(), cb_r["date"].max())

# ── HTML 생성 ──────────────────────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>실패없는 카페 선택 — PMF 분석 리포트</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
         background: #f4f4f5; color: #18181b; padding: 24px 16px; }}
  .wrap {{ max-width: 900px; margin: 0 auto; }}

  /* 헤더 */
  .header {{ background: #18181b; border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; color: #fff; }}
  .header h1 {{ font-size: 20px; font-weight: 800; margin-bottom: 4px; }}
  .header .sub {{ font-size: 12px; color: #71717a; margin-top: 6px; }}
  .header .period {{ font-size: 12px; color: #a1a1aa; margin-top: 4px; }}

  /* 카드 공통 */
  .card {{ background: #fff; border-radius: 14px; padding: 20px 22px;
           box-shadow: 0 1px 4px rgba(0,0,0,0.06); }}

  /* 숫자 카드 그리드 */
  .kpi-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }}
  .kpi {{ background: #fff; border-radius: 14px; padding: 18px 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); }}
  .kpi .num {{ font-size: 34px; font-weight: 800; line-height: 1; }}
  .kpi .label {{ font-size: 12px; color: #71717a; margin-top: 6px; }}
  .kpi .sub {{ font-size: 11px; color: #a1a1aa; margin-top: 2px; }}

  /* 2단 그리드 */
  .grid2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }}
  @media (max-width: 640px) {{ .kpi-grid {{ grid-template-columns: repeat(2,1fr); }}
                                .grid2 {{ grid-template-columns: 1fr; }} }}

  h2 {{ font-size: 14px; font-weight: 700; color: #18181b; margin-bottom: 14px; }}
  .mb16 {{ margin-bottom: 16px; }}

  /* PMF 지표 행 */
  .pmf-row {{ display: flex; justify-content: space-between; align-items: center;
              padding: 11px 0; border-bottom: 1px solid #f4f4f5; }}
  .pmf-row:last-child {{ border-bottom: none; }}
  .pmf-left .name {{ font-size: 13px; color: #3f3f46; font-weight: 600; }}
  .pmf-left .desc {{ font-size: 11px; color: #a1a1aa; margin-top: 2px; }}
  .pmf-right {{ text-align: right; }}
  .pmf-right .val {{ font-size: 20px; font-weight: 800; }}
  .tag {{ display: inline-block; padding: 1px 7px; border-radius: 99px;
          font-size: 10px; font-weight: 700; margin-left: 4px; vertical-align: middle; }}

  /* CBTI 퍼널 */
  .funnel {{ display: flex; align-items: center; gap: 0; margin-bottom: 20px; }}
  .funnel-step {{ flex: 1; text-align: center; padding: 14px 8px; border-radius: 10px; }}
  .funnel-step .fnum {{ font-size: 26px; font-weight: 800; line-height: 1; }}
  .funnel-step .flbl {{ font-size: 11px; margin-top: 4px; }}
  .funnel-arrow {{ font-size: 16px; color: #d4d4d8; padding: 0 4px; flex-shrink: 0; }}

  table {{ border-collapse: collapse; width: 100%; }}
  .section-title {{ font-size: 11px; font-weight: 700; color: #a1a1aa;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    margin-bottom: 12px; }}
</style>
</head>
<body>
<div class="wrap">

  <!-- 헤더 -->
  <div class="header">
    <h1>☕ 실패없는 카페 선택 — PMF 분석 리포트</h1>
    <div class="sub">기준: {NOW}</div>
    <div class="period">분석 기간: {min_date} ~ {max_date_str} &nbsp;|&nbsp;
      sessions {len(s_r)}건 + sessions_v2 {len(v2_r)}건 + CBTI {total_cbti}건 (utm=admin 제외)</div>
  </div>

  <!-- KPI 카드 -->
  <div class="kpi-grid">
    <div class="kpi">
      <div class="num" style="color:#6366f1">{total_main}</div>
      <div class="label">총 메인 세션</div>
      <div class="sub">s:{len(s_r)} + v2:{len(v2_r)}</div>
    </div>
    <div class="kpi">
      <div class="num" style="color:#8b5cf6">{total_cbti}</div>
      <div class="label">CBTI 세션</div>
      <div class="sub">완료율 {cbti_complete_pct:.0f}%</div>
    </div>
    <div class="kpi">
      <div class="num" style="color:#22c55e">{dir_sess}</div>
      <div class="label">길찾기 클릭 세션</div>
      <div class="sub">실사용 의도 ⭐ {dir_pct:.1f}%</div>
    </div>
    <div class="kpi">
      <div class="num" style="color:#f59e0b">{map_sess}</div>
      <div class="label">지도 활용 세션</div>
      <div class="sub">{map_pct:.1f}%</div>
    </div>
    <div class="kpi">
      <div class="num" style="color:#ec4899">{filt_sess}</div>
      <div class="label">필터 사용 세션</div>
      <div class="sub">{filt_pct:.1f}%</div>
    </div>
    <div class="kpi">
      <div class="num" style="color:#0ea5e9">{int(cbti_converted)}</div>
      <div class="label">CBTI→메인 전환</div>
      <div class="sub">{cbti_convert_pct:.1f}% / 완료자 기준</div>
    </div>
  </div>

  <!-- PMF 핵심 지표 -->
  <div class="card mb16">
    <h2>🎯 PMF 핵심 지표</h2>
    <div class="pmf-row">
      <div class="pmf-left">
        <div class="name">길찾기 클릭율
          <span class="tag" style="background:#f0fdf4;color:#22c55e">실사용 의도</span>
        </div>
        <div class="desc">실제로 카페에 가려는 행동 / 총 {dir_sess}세션</div>
      </div>
      <div class="pmf-right">
        <div class="val" style="color:#22c55e">{dir_pct:.1f}%</div>
        {pct_badge(dir_pct, 20, 10)}
      </div>
    </div>
    <div class="pmf-row">
      <div class="pmf-left">
        <div class="name">카드 클릭율
          <span class="tag" style="background:#fff7ed;color:#f59e0b">관심 표현</span>
        </div>
        <div class="desc">특정 카페 상세 확인 / sessions 기준 {cafe_sess}세션 (v2 집계 완료)</div>
      </div>
      <div class="pmf-right">
        <div class="val" style="color:#f59e0b">{cafe_pct:.1f}%</div>
        {pct_badge(cafe_pct, 30, 15)}
      </div>
    </div>
    <div class="pmf-row">
      <div class="pmf-left">
        <div class="name">지도 활용율
          <span class="tag" style="background:#eff6ff;color:#6366f1">공간 탐색</span>
        </div>
        <div class="desc">지도 핀으로 카페 위치 탐색 / {map_sess}세션</div>
      </div>
      <div class="pmf-right">
        <div class="val" style="color:#6366f1">{map_pct:.1f}%</div>
        {pct_badge(map_pct, 20, 10)}
      </div>
    </div>
    <div class="pmf-row">
      <div class="pmf-left">
        <div class="name">필터 사용율
          <span class="tag" style="background:#fdf4ff;color:#8b5cf6">능동 탐색</span>
        </div>
        <div class="desc">여유/보통/혼잡 필터링 / {filt_sess}세션</div>
      </div>
      <div class="pmf-right">
        <div class="val" style="color:#8b5cf6">{filt_pct:.1f}%</div>
        {pct_badge(filt_pct, 25, 10)}
      </div>
    </div>
    <div class="pmf-row">
      <div class="pmf-left">
        <div class="name">공유율
          <span class="tag" style="background:#f0f9ff;color:#0ea5e9">바이럴</span>
        </div>
        <div class="desc">카카오톡/링크 공유 / {share_sess}세션</div>
      </div>
      <div class="pmf-right">
        <div class="val" style="color:#0ea5e9">{share_pct:.1f}%</div>
        {pct_badge(share_pct, 10, 3)}
      </div>
    </div>
  </div>

  <!-- CBTI 퍼널 + 유형 분포 -->
  <div class="card mb16">
    <h2>🧠 CBTI 퍼널</h2>
    <div class="funnel">
      <div class="funnel-step" style="background:#fdf4ff">
        <div class="fnum" style="color:#8b5cf6">{total_cbti}</div>
        <div class="flbl" style="color:#8b5cf6">시작</div>
      </div>
      <div class="funnel-arrow">→</div>
      <div class="funnel-step" style="background:#ede9fe">
        <div class="fnum" style="color:#7c3aed">{int(cbti_completed)}</div>
        <div class="flbl" style="color:#7c3aed">완료 ({cbti_complete_pct:.0f}%)</div>
      </div>
      <div class="funnel-arrow">→</div>
      <div class="funnel-step" style="background:#eff6ff">
        <div class="fnum" style="color:#3b82f6">{int(cbti_converted)}</div>
        <div class="flbl" style="color:#3b82f6">메인 전환 ({cbti_convert_pct:.0f}%)</div>
      </div>
    </div>

    <div class="grid2">
      <div>
        <div class="section-title">유형별 분포</div>
        <table>{cbti_result_html}</table>
      </div>
      <div>
        <div class="section-title">채널별 전환율</div>
        <table>
          <tr>
            <th style="padding:4px 12px 4px 0;font-size:11px;color:#a1a1aa;text-align:left;font-weight:600">채널</th>
            <th style="padding:4px 8px;font-size:11px;color:#a1a1aa;text-align:center;font-weight:600">시작</th>
            <th style="padding:4px 8px;font-size:11px;color:#6366f1;text-align:center;font-weight:600">전환</th>
            <th style="padding:4px 0;font-size:11px;color:#a1a1aa;text-align:center;font-weight:600">전환율</th>
          </tr>
          {cbti_utm_html}
        </table>
      </div>
    </div>
  </div>

  <!-- 채널 + 날짜 추이 -->
  <div class="grid2">
    <div class="card">
      <h2>🚦 유입 채널</h2>
      <table>{utm_rows_html}</table>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f4f4f5">
        <div style="font-size:11px;color:#a1a1aa">디바이스</div>
        <div style="margin-top:6px;display:flex;gap:12px">
          {"".join(f'<span style="font-size:13px;font-weight:700;color:#444">{d} <span style="color:#a1a1aa;font-weight:400;font-size:12px">{c}건 ({c/total_main*100:.0f}%)</span></span>' for d,c in device_all.items())}
        </div>
      </div>
    </div>
    <div class="card">
      <h2>📅 날짜별 세션 추이</h2>
      <table>{date_rows_html}</table>
    </div>
  </div>

  <!-- 시간대 -->
  <div class="card mb16" style="margin-top:16px">
    <h2>⏰ 시간대별 이용 패턴 <span style="font-size:11px;color:#a1a1aa;font-weight:400">sessions_v2 기준 (6/14~)</span></h2>
    <table>{hour_rows_html}</table>
    <div style="margin-top:10px;font-size:11px;color:#a1a1aa">
      💡 11시 피크 = 에버리타임 게시글 게시 직후 유입 급증 패턴
    </div>
  </div>

  <!-- 행동 요약 -->
  <div class="card mb16">
    <h2>📊 이벤트 발생 횟수 (sessions + sessions_v2 합산)</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:4px">
      {''.join(f"""<div style="background:#f9fafb;border-radius:10px;padding:14px 16px">
        <div style="font-size:22px;font-weight:800;color:{color}">{total}</div>
        <div style="font-size:11px;color:#71717a;margin-top:3px">{label}</div>
        <div style="font-size:10px;color:#a1a1aa">{sess}세션</div>
      </div>""" for label, total, sess, color in [
        ("카드 클릭", cafe_total, cafe_sess, "#f59e0b"),
        ("지도 클릭", map_total, map_sess, "#6366f1"),
        ("필터 클릭", filt_total, filt_sess, "#8b5cf6"),
        ("길찾기 클릭 ⭐", dir_total, dir_sess, "#22c55e"),
        ("공유 클릭", share_total, share_sess, "#0ea5e9"),
        ("CBTI 완료", int(cbti_completed), int(cbti_completed), "#ec4899"),
      ])}
    </div>
  </div>

  <div style="text-align:center;font-size:11px;color:#d4d4d8;margin-top:20px;padding-bottom:8px">
    실패없는 카페 선택 PMF 분석 | {NOW}
  </div>

</div>
</body>
</html>"""

with open("analysis_report.html", "w", encoding="utf-8") as f:
    f.write(html)

print(f"✅ analysis_report.html 생성 완료")
print(f"   기간: {min_date} ~ {max_date_str}")
print(f"   총 세션: {total_main}건 (메인) + {total_cbti}건 (CBTI)")
print(f"   길찾기 클릭: {dir_sess}세션 ({dir_pct:.1f}%)")
print(f"   CBTI → 메인 전환: {int(cbti_converted)}/{int(cbti_completed)} ({cbti_convert_pct:.1f}%)")
