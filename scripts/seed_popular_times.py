import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import pytz
import os, json, base64

# GitHub Actions → 환경변수에서 읽기 / 로컬 → 파일에서 읽기
encoded = os.environ.get("FIREBASE_CREDENTIALS")
if encoded:
    cred_dict = json.loads(base64.b64decode(encoded))
    cred = credentials.Certificate(cred_dict)
else:
    cred = credentials.Certificate("firebase_credentials.json")

firebase_admin.initialize_app(cred)
db = firestore.client()

KST = pytz.timezone("Asia/Seoul")
now = datetime.now(KST)

day_map = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
day_key = day_map[now.weekday()]
hour = now.hour

print(f"현재 시각: {now.strftime('%Y-%m-%d %H:%M')} KST ({day_key}, {hour}시)")

cafes = db.collection("cafes").stream()
count = 0

for doc in cafes:
    data = doc.to_dict()
    cafe_id = doc.id
    name = data.get("name", cafe_id)
    total_seats = data.get("total_seats", 0)
    popular_times = data.get("popular_times", {})

    day_data = popular_times.get(day_key, [0] * 24)
    
    if hour < len(day_data):
        popularity = day_data[hour]
    else:
        popularity = 0

    occupancy_rate = popularity / 100
    available_seats = max(0, int(total_seats * (1 - occupancy_rate)))

    if popularity <= 40:
        status = "여유"
    elif popularity <= 70:
        status = "보통"
    else:
        status = "혼잡"

    db.collection("occupancy").document(cafe_id).set({
        "cafe_id": cafe_id,
        "name": name,
        "total_seats": total_seats,
        "popularity": popularity,
        "available_seats": available_seats,
        "status": status,
        "updated_at": now.isoformat(),
    })

    print(f"  {name}: {popularity}% → {status} (가용 {available_seats}/{total_seats}석)")
    count += 1

print(f"\n{count}개 카페 occupancy 업데이트 완료")
