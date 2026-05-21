"""
seed_cafes.py
Firebase Firestore의 cafes 컬렉션에 카페 기본 정보를 최초 등록한다.
한 번만 실행하면 됨.

실행:
  python scripts/seed_cafes.py
"""

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

CAFES = [
    {
        "id": "starbucks_dongmun",
        "name": "스타벅스 연대동문점",
        "place_id": "ChIJNYo7_oaYfDXDSnQcQmugow",
        "lat": 37.5664233,
        "lng": 126.9463242,
        "total_seats": 50,
        "naver_url": "https://map.naver.com/v5/search/스타벅스 연대동문점",
    },
    {
        "id": "letmealone",
        "name": "렛미얼론",
        "place_id": "ChIJ7xbMEwCZfDX8d1Z_5M1INQ",
        "lat": 37.5591203,
        "lng": 126.9367621,
        "total_seats": 80,
        "naver_url": "https://map.naver.com/v5/search/렛미얼론",
    },
    {
        "id": "eagle_dabang",
        "name": "독수리다방",
        "place_id": "ChIJWy9o5ZOYfDUuOMCwKj8Rlw",
        "lat": 37.5587606,
        "lng": 126.9372411,
        "total_seats": 70,
        "naver_url": "https://map.naver.com/v5/search/독수리다방",
    },
    {
        "id": "twosome_yonsei",
        "name": "투썸플레이스 신촌연세로점",
        "place_id": "ChIJM3b2wbuZfDX_Gy_aJtksvQ",
        "lat": 37.5581373,
        "lng": 126.9370567,
        "total_seats": 50,
        "naver_url": "https://map.naver.com/v5/search/투썸플레이스 신촌연세로점",
    },
    {
        "id": "starbucks_yonsei",
        "name": "스타벅스 연대점",
        "place_id": "ChIJLz_W9JOYfDV2qkxBAkG5Iw",
        "lat": 37.5586535,
        "lng": 126.9366773,
        "total_seats": 60,
        "naver_url": "https://map.naver.com/v5/search/스타벅스 연대점",
    },
    {
        "id": "hollys_sinchon",
        "name": "할리스커피 신촌점",
        "place_id": "ChIJtWLDJACZfDUuecQR-ZvtCQ",
        "lat": 37.5586105,
        "lng": 126.9371813,
        "total_seats": 50,
        "naver_url": "https://map.naver.com/v5/search/할리스커피 신촌점",
    },
    {
        "id": "cafe_place",
        "name": "카페 플레이스",
        "place_id": "ChIJb3mbyfuZfDVEA4KFljTKnw",
        "lat": 37.5575151,
        "lng": 126.9370634,
        "total_seats": 60,
        "naver_url": "https://map.naver.com/v5/search/카페 플레이스",
    },
    {
        "id": "mahogany_yonsei",
        "name": "마호가니 연세대 공학관점",
        "place_id": "ChIJoRAcrmWZfDV-Bf92TxozJg",
        "lat": 37.5618439,
        "lng": 126.9361532,
        "total_seats": 40,
        "naver_url": "https://map.naver.com/v5/search/마호가니 연세대 공학관점",
    },
    {
        "id": "cafe_ann",
        "name": "카페앤",
        "place_id": "ChIJy2uo6eCZfDWhorv5vDusZQ",
        "lat": 37.556928,
        "lng": 126.9371466,
        "total_seats": 70,
        "naver_url": "https://map.naver.com/v5/search/카페앤",
    },
]

for cafe in CAFES:
    doc_id = cafe.pop("id")
    db.collection("cafes").document(doc_id).set(cafe)
    print(f"✅ 등록 완료: {cafe['name']}")

print(f"\n총 {len(CAFES)}개 카페 등록 완료")
