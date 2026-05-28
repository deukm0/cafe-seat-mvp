"""
seed_cafes.py (updated 2026.05)
변경사항:
- 스타벅스 연대동문점 삭제
- 엘피스카페 신촌점 추가
- 전체 카페명 / naver_url 정비
- total_seats 최신화
- 기존 lat/lng/place_id 보존 (merge=True)

실행:
  python scripts/seed_cafes.py
"""

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── 업데이트할 카페 목록 ───────────────────────────────────────────────────
# lat/lng/place_id 는 Firebase에 이미 있으므로 merge=True 로 보존
# 새 카페(elpis_sinchon)는 전체 필드 포함

CAFES = [
    {
        "id": "letmealone",
        "name": "렛미얼론",
        "total_seats": 80,
        "naver_url": "https://map.naver.com/p/entry/place/1618419604",
    },
    {
        "id": "eagle_dabang",
        "name": "독수리다방",
        "total_seats": 70,
        "naver_url": "https://map.naver.com/p/entry/place/31608233",
    },
    {
        "id": "twosome_yonsei",
        "name": "투썸플레이스 신촌연세로점",
        "total_seats": 50,
        "naver_url": "https://map.naver.com/p/entry/place/1935823121",
    },
    {
        "id": "starbucks_yonsei",
        "name": "스타벅스 연대점",
        "total_seats": 60,
        "naver_url": "https://map.naver.com/p/entry/place/11807591",
    },
    {
        "id": "hollys_sinchon",
        "name": "할리스 신촌점",
        "total_seats": 50,
        "naver_url": "https://map.naver.com/p/entry/place/11593558",
    },
    {
        "id": "cafe_place",
        "name": "카페 플레이스",
        "total_seats": 60,
        # ⚠️ 네이버 지도 URL 미확인 — 정확한 URL 확인 후 업데이트 필요
        "naver_url": "https://map.naver.com/v5/search/카페 플레이스 신촌",
    },
    {
        "id": "mahogany_yonsei",
        "name": "마호가니 연세대점",
        "total_seats": 40,
        "naver_url": "https://map.naver.com/p/entry/place/1432206951",
    },
    {
        "id": "cafe_ann",
        "name": "카페앤 신촌점",
        "total_seats": 70,
        "naver_url": "https://map.naver.com/p/entry/place/1975933458",
    },
    # ── 신규 카페 ────────────────────────────────────────────────────────────
    {
        "id": "elpis_sinchon",
        "name": "엘피스카페 신촌점",
        "total_seats": 50,         # TODO: 현장 조사 후 정확한 좌석 수로 수정
        "naver_url": "https://map.naver.com/p/entry/place/38275926",
        "place_id": "",            # TODO: Google Maps Place ID 확인 후 입력
        "lat": 37.5584,            # TODO: 구글맵에서 정확한 위도 확인 후 수정
        "lng": 126.9369,           # TODO: 구글맵에서 정확한 경도 확인 후 수정
    },
]

# ── 1) 삭제: 스타벅스 연대동문점 ──────────────────────────────────────────
print("🗑️  스타벅스 연대동문점 삭제 중...")
db.collection("cafes").document("starbucks_dongmun").delete()
db.collection("occupancy").document("starbucks_dongmun").delete()
print("✅ 삭제 완료\n")

# ── 2) 카페 정보 업데이트 ─────────────────────────────────────────────────
for cafe in CAFES:
    doc_id = cafe.pop("id")
    is_new = doc_id == "elpis_sinchon"

    if is_new:
        # 신규: 전체 필드 덮어쓰기
        db.collection("cafes").document(doc_id).set(cafe)
        print(f"🆕 신규 등록: {cafe['name']}")
    else:
        # 기존: merge=True → lat, lng, place_id, updated_at 보존
        db.collection("cafes").document(doc_id).set(cafe, merge=True)
        print(f"✅ 업데이트: {cafe['name']}")

print(f"\n총 {len(CAFES)}개 카페 처리 완료")
print("\n⚠️  TODO 체크리스트:")
print("  - 엘피스카페 신촌점 좌석 수 현장 확인")
print("  - 엘피스카페 신촌점 lat/lng 구글맵에서 확인 후 Firebase 직접 수정")
print("  - 엘피스카페 신촌점 Google Maps Place ID 확인")
print("  - 카페 플레이스 네이버 지도 정확한 URL 확인")