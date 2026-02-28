# GT_Sim API 追加リクエスト — OpenSCENARIO エディタ連携用

## 背景

OpenSCENARIO エディタ（GT-OpenSCENARIOEditor）から GT_Sim API を利用してシミュレーションを実行したい。
現在の GT_Sim API は「ディスク上のシナリオファイルを指定して実行 → 完了後に結果取得」の設計だが、
エディタは「ブラウザ上で作成した XML を送信 → gRPC でリアルタイム受信」という使い方をする。

### エディタ側の期待するデータ形式

```typescript
interface SimulationFrame {
  time: number;                        // 秒
  objects: SimulationObjectState[];    // 全エンティティの状態
}

interface SimulationObjectState {
  id: number; name: string;
  x: number; y: number; z: number;     // ワールド座標 (m)
  h: number; p: number; r: number;     // yaw, pitch, roll (rad)
  speed: number;                       // m/s
  wheel_angle?: number; wheel_rot?: number;
  roadId?: number; laneId?: number; s?: number; t?: number;
}
```

エンティティは **`name` フィールド**（OpenSCENARIO の Entity name: "Ego", "Target" 等）で照合する。

---

## データ取得方式

gRPC `GroundTruthService.StreamGroundTruth()` をリアルタイムで受信し、
エディタ側で `osi3.GroundTruth` → `SimulationFrame` に変換する。
gRPC は実行中のフレームをリアルタイム（1フレーム＝1送信）で出力し、実行後の再ストリームはできない。

そのため、エディタ側で受信した全フレームをバッファに蓄積し、
シミュレーション完了後はそのバッファを使って再生・シーク・速度変更を行う。

---

## 追加リクエスト API 一覧

### [必須] API-1: シナリオ一時アップロード

エディタで作成した .xosc XML をサーバーにアップロードし、一時的な scenario_id を取得する。

```
POST /api/scenarios/upload
Content-Type: text/xml  (or application/xml or multipart/form-data)

Body: .xosc XML文字列

Response 201:
{
  "scenario_id": "tmp_abc12345",
  "entities": [
    {"name": "Ego", "model": "car_white"},
    {"name": "Target", "model": "car_red"}
  ],
  "road_file": "../xodr/straight_500m.xodr",
  "expires_at": "2026-02-28T12:00:00Z"
}
```

**要件**:
- 返された `scenario_id` は既存の `POST /api/simulations` の `scenario_id` フィールドで使用可能
- 一時ファイルは TTL ベースで自動クリーンアップ（例: 1時間後）
- `DELETE /api/scenarios/upload/{scenario_id}` で明示削除も可能（任意）

**理由**: エディタはブラウザ上でシナリオを構築するため、ファイルシステムに .xosc ファイルが存在しない。

---

### [推奨] API-2: 道路データ一時アップロード

```
POST /api/roads/upload
Content-Type: text/xml

Body: .xodr XML文字列

Response 201:
{
  "road_id": "tmp_road_abc",
  "road_path": "resources/xodr/tmp_road_abc.xodr"
}
```

**理由**: エディタでカスタム .xodr を読み込んでいる場合、GT_Sim の resources ディレクトリにないファイルも扱いたい。

---

### [推奨] API-3: シミュレーション速度制御

```
PUT /api/simulations/{job_id}/speed
Content-Type: application/json

Body:
{
  "speed_factor": 2.0   // 1.0 = リアルタイム, 2.0 = 2倍速, 0.5 = 半速
}

Response 200:
{
  "job_id": "abc12345",
  "speed_factor": 2.0
}
```

**理由**: リアルタイム再生中のユーザー速度変更。

---

## gRPC ストリーミング — OSI GroundTruth → SimulationFrame 変換

既存の gRPC `GroundTruthService.StreamGroundTruth()` をエディタから直接利用する。
このストリームが唯一のフレームデータソースとなる。

### Entity name の取得方法（確認済み）

`MovingObject.source_reference[]` に OpenSCENARIO のエンティティ情報が格納されている:

```
source_reference.type = "net.asam.openscenario"
source_reference.identifier[0] = "entity_id:{id}"        // 例: "entity_id:0"
source_reference.identifier[1] = "entity_type:{type}"     // 例: "entity_type:Vehicle"
source_reference.identifier[2] = "entity_name:{name}"     // 例: "entity_name:Ego"
```

エディタ側のパース:
```typescript
function getEntityName(movingObject: osi3.MovingObject): string {
  for (const ref of movingObject.source_reference) {
    if (ref.type === "net.asam.openscenario") {
      for (const id of ref.identifier) {
        if (id.startsWith("entity_name:")) {
          return id.substring("entity_name:".length);
        }
      }
    }
  }
  return `object_${movingObject.id.value}`;  // fallback
}
```

### 変換マッピング（確定）

| OSI GroundTruth | → | SimulationFrame |
|---|---|---|
| `timestamp.seconds + nanos/1e9` | → | `frame.time` |
| `moving_object[].id.value` | → | `object.id` |
| `moving_object[].base.position.{x,y,z}` | → | `object.{x,y,z}` |
| `moving_object[].base.orientation.{yaw,pitch,roll}` | → | `object.{h,p,r}` |
| `‖moving_object[].base.velocity‖` | → | `object.speed` |
| `source_reference[type="net.asam.openscenario"].identifier["entity_name:*"]` | → | `object.name` |

---

## エディタ側のシミュレーション実行フロー

```
1. エディタ → POST /api/scenarios/upload (XML) → scenario_id
2. エディタ → POST /api/simulations { scenario_id, execution: { osi: { enabled: true } } }
3. エディタ → gRPC StreamGroundTruth() 接続
4. リアルタイムで osi3.GroundTruth → SimulationFrame 変換 → 3D ビューア表示
5. エディタ側で全フレームをバッファに蓄積（シーク・巻き戻し用）
6. シミュレーション完了後: バッファ済みフレームで再生・シーク・速度変更
7. PUT /api/simulations/{job_id}/speed でシミュレーション実行速度変更（任意）
```
