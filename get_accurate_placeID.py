"""
find_place_ids.py
Google Places API로 카페별 정확한 Place ID를 찾아서 출력한다.
한 번만 실행하면 됨.

실행: py scripts/find_place_ids.py
"""

import requests

API_KEY = "AIzaSyBP2TkDr-zu-Ld0VDj1UH8uAuiXmrNmHlM"  # ← 발급받은 API 키로 교체

CAFES = [
    ("starbucks_dongmun",  "스타벅스 연대동문점",       37.5664, 126.9463),
    ("letmealone",         "렛미얼론 신촌",              37.5591, 126.9368),
    ("eagle_dabang",       "독수리다방 신촌",            37.5588, 126.9372),
    ("twosome_yonsei",     "투썸플레이스 신촌연세로점",  37.5581, 126.9371),
    ("starbucks_yonsei",   "스타벅스 연대점",            37.5587, 126.9367),
    ("hollys_sinchon",     "할리스커피 신촌점",          37.5586, 126.9372),
    ("cafe_place",         "카페 플레이스 신촌",         37.5575, 126.9371),
    ("mahogany_yonsei",    "마호가니 연세대 공학관",     37.5618, 126.9362),
    ("cafe_ann",           "카페앤 신촌",                37.5569, 126.9371),
]

print("=== Place ID 조회 결과 ===\n")

results = {}
for doc_id, name, lat, lng in CAFES:
    resp = requests.get(
        "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
        params={
            "input":       name,
            "inputtype":   "textquery",
            "fields":      "place_id,name",
            "locationbias": f"circle:300@{lat},{lng}",
            "key":         API_KEY,
        }
    )
    data = resp.json()
    candidates = data.get("candidates", [])

    if candidates:
        place_id   = candidates[0].get("place_id", "NOT FOUND")
        found_name = candidates[0].get("name", "")
        print(f'✅ {name}')
        print(f'   doc_id:   {doc_id}')
        print(f'   place_id: {place_id}')
        print(f'   확인:     {found_name}')
        results[doc_id] = place_id
    else:
        print(f'❌ {name} → 찾을 수 없음 (status: {data.get("status")})')
        results[doc_id] = None

    print()

# collect_populartimes.py에 바로 붙여쓸 수 있게 출력
print("\n=== collect_populartimes.py 용 PLACE_IDS 딕셔너리 ===\n")
print("PLACE_IDS = {")
for doc_id, pid in results.items():
    print(f'    "{doc_id}": "{pid}",')
print("}")