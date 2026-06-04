"""
debug_latlng.py — 진단용 스크립트 (Firebase 수정 없음, 로그만 출력)
실행: python scripts/debug_latlng.py
"""
import requests

GOOGLE_API_KEY = "AIzaSyBP2TkDr-zu-Ld0VDj1UH8uAuiXmrNmHlM"
PLACES_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"

CAFE_QUERIES = {
    "starbucks_myeongmul": "스타벅스 신촌명물거리점 서울",
    "starbucks_sinchon":   "스타벅스 신촌점 서울 신촌로",
    "twosome_sinchon_station": "투썸플레이스 신촌기차역점 서울",
    "hollys_sinchon_station":  "할리스커피 신촌역점 서울",
    "coffeebean_sinchon":  "커피빈 신촌점 서울 신촌",
    "fortyd":              "포티드 카페 신촌 서울",
    "flickon_coffee":      "플릭온커피 신촌 서울",
    "sulbing_sinchon":     "설빙 신촌점 서울",
    "chloris_sinchon":     "클로리스 신촌본점 서울",
    "twosome_yonsei":      "투썸플레이스 신촌연세로점 서울",
    "starbucks_yonsei":    "스타벅스 연대점 서울 연세로",
    "hollys_sinchon":      "할리스커피 신촌점 서울 명물거리",
    "letmealone":          "렛미얼론 신촌 서울",
    "elpis_sinchon":       "앨피스카페 신촌점 서울",
    "cafe_ann":            "카페앤 신촌점 서울",
    "eagle_dabang":        "독수리다방 신촌 서울",
    "mahogany_yonsei":     "마호가니 연세대점 서울",
}

print("=" * 65)
print("  Google Places API 진단 로그")
print("=" * 65)

# 1) API 키 자체가 유효한지 먼저 1개로 테스트
test_params = {
    "input": "스타벅스 신촌점 서울",
    "inputtype": "textquery",
    "fields": "name,geometry",
    "key": GOOGLE_API_KEY,
    "language": "ko",
}
test_res = requests.get(PLACES_URL, params=test_params)
test_data = test_res.json()

print(f"\n[API 키 상태 체크]")
print(f"  HTTP Status : {test_res.status_code}")
print(f"  API Status  : {test_data.get('status')}")
if test_data.get("error_message"):
    print(f"  에러 메시지 : {test_data['error_message']}")
if test_data.get("candidates"):
    c = test_data["candidates"][0]
    print(f"  찾은 이름   : {c.get('name', '없음')}")
    print(f"  좌표        : {c.get('geometry', {}).get('location', '없음')}")
print()

# 2) 전체 카페 순회
print("-" * 65)
print(f"{'ID':30s} | {'API Status':12s} | {'결과'}")
print("-" * 65)

for cafe_id, query in CAFE_QUERIES.items():
    params = {
        "input": query,
        "inputtype": "textquery",
        "fields": "name,geometry",
        "locationbias": "circle:1000@37.5580,126.9362",
        "key": GOOGLE_API_KEY,
        "language": "ko",
    }
    res = requests.get(PLACES_URL, params=params)
    data = res.json()
    status = data.get("status", "UNKNOWN")

    if status == "OK" and data.get("candidates"):
        c = data["candidates"][0]
        loc = c["geometry"]["location"]
        found_name = c.get("name", "?")
        print(f"  {cafe_id:28s} | ✅ {status:10s} | {found_name} → ({loc['lat']:.5f}, {loc['lng']:.5f})")
    else:
        err = data.get("error_message", data.get("status", "응답 없음"))
        print(f"  {cafe_id:28s} | ❌ {status:10s} | {err}")
        print(f"  {'':28s} |   검색어: {query}")

print("=" * 65)
