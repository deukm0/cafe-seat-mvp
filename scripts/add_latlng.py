"""
add_latlng.py — 일회성 스크립트
Google Places API로 17개 카페 좌표(lat/lng)를 조회해서 Firebase에 추가한다.

실행: python scripts/add_latlng.py  (프로젝트 루트에서)
"""

import requests
import firebase_admin
from firebase_admin import credentials, firestore

# ── 설정 ────────────────────────────────────────────────────────────────────
GOOGLE_API_KEY = "AIzaSyBP2TkDr-zu-Ld0VDj1UH8uAuiXmrNmHlM"
PLACES_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"

# Firebase 초기화
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── 카페별 검색어 (정확도를 위해 영문/공식명 + 주소 조합) ────────────────────
CAFE_QUERIES = {
    "starbucks_myeongmul": "스타벅스 신촌명물거리점",
    "starbucks_sinchon":   "스타벅스 신촌점",
    "twosome_sinchon_station": "투썸플레이스 신촌기차역점",
    "hollys_sinchon_station":  "할리스커피 신촌점",
    "coffeebean_sinchon":  "커피빈 신촌점",
    "fortyd":              "포티드",
    "flickon_coffee":      "플릭온커피",
    "sulbing_sinchon":     "설빙 신촌점",
    "chloris_sinchon":     "클로리스 신촌본점",
    "twosome_yonsei":      "투썸플레이스 신촌연세로점",
    "starbucks_yonsei":    "스타벅스 연대점",
    "hollys_sinchon":      "할리스커피 신촌연세로점",
    "letmealone":          "렛미얼론",
    "elpis_sinchon":       "앨피스카페",
    "cafe_ann":            "카페앤 신촌점",
    "eagle_dabang":        "독수리다방",
    "mahogany_yonsei":     "마호가니 연세대학교 공학관점",
}

def get_latlng(query):
    """Google Places API로 좌표 조회"""
    params = {
        "input": query,
        "inputtype": "textquery",
        "fields": "geometry",
        "locationbias": "circle:1000@37.5580,126.9362",  # 신촌 중심 반경 1km
        "key": GOOGLE_API_KEY,
        "language": "ko",
    }
    res = requests.get(PLACES_URL, params=params)
    data = res.json()

    if data.get("status") == "OK" and data.get("candidates"):
        loc = data["candidates"][0]["geometry"]["location"]
        return loc["lat"], loc["lng"]
    return None, None

# ── 실행 ─────────────────────────────────────────────────────────────────────
print(f"{'='*55}")
print(f"  좌표 조회 및 Firebase 업데이트 시작 ({len(CAFE_QUERIES)}개)")
print(f"{'='*55}\n")

success, fail = 0, 0

for cafe_id, query in CAFE_QUERIES.items():
    lat, lng = get_latlng(query)
    if lat and lng:
        db.collection("cafes").document(cafe_id).update({"lat": lat, "lng": lng})
        print(f"  ✅ {cafe_id:30s}  {lat:.6f}, {lng:.6f}")
        success += 1
    else:
        print(f"  ❌ {cafe_id:30s}  조회 실패 — 수동 입력 필요")
        fail += 1

print(f"\n{'='*55}")
print(f"  완료: 성공 {success}개 / 실패 {fail}개")
if fail > 0:
    print(f"  ⚠️  실패한 카페는 Firebase Console에서 직접 lat/lng 입력하세요")
print(f"{'='*55}")
