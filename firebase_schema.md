# Firebase Firestore 스키마 설계

## 컬렉션 구조

```
Firestore
├── cafes/                          # 카페 기본 정보 (정적)
│   └── {cafe_id}/
│       ├── name: string            # 카페명 (예: "할리스 신촌점")
│       ├── address: string         # 주소
│       ├── total_seats: number     # 총 좌석 수 (현장 조사값)
│       ├── place_id: string        # Google Maps Place ID
│       ├── naver_place_id: string  # 네이버 지도 Place ID (선택)
│       ├── lat: number             # 위도
│       ├── lng: number             # 경도
│       ├── image_url: string       # 카페 대표 이미지 (선택)
│       └── updated_at: timestamp   # 정보 최종 수정일
│
└── occupancy/                      # 혼잡도 (동적, 30분마다 갱신)
    └── {cafe_id}/
        ├── current_popularity: number   # 현재 혼잡도 지수 (0~100)
        ├── status: string               # "여유" | "보통" | "혼잡"
        ├── available_seats: number      # 추정 가용 좌석 수
        ├── occupancy_rate: number       # 점유율 (0.0~1.0)
        └── fetched_at: timestamp        # 수집 시각
```

## 상태 분류 기준

| status | current_popularity 범위 | 색상 |
|--------|------------------------|------|
| 여유   | 0 ~ 40                 | 🟢 초록 |
| 보통   | 41 ~ 70                | 🟡 노랑 |
| 혼잡   | 71 ~ 100               | 🔴 빨강 |

## 예시 데이터

### cafes/hollys_sinchon
```json
{
  "name": "할리스 신촌점",
  "address": "서울 서대문구 신촌로 25",
  "total_seats": 60,
  "place_id": "ChIJ...",
  "lat": 37.5551,
  "lng": 126.9368,
  "updated_at": "2026-05-20T00:00:00Z"
}
```

### occupancy/hollys_sinchon
```json
{
  "current_popularity": 55,
  "status": "보통",
  "available_seats": 27,
  "occupancy_rate": 0.55,
  "fetched_at": "2026-05-20T14:30:00Z"
}
```

## 현장 조사 시 수집해야 할 항목

| 항목 | 수집 방법 |
|------|-----------|
| 카페명 (공식명) | 현장 확인 |
| 주소 | 네이버 지도 |
| 총 좌석 수 | 직접 카운트 |
| Google Place ID | Google Maps URL 또는 Places API |
| 위도/경도 | Google Maps |
| 카페 이미지 URL | 선택 사항 |
