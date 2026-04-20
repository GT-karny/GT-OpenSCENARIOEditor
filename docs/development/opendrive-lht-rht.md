# OpenDRIVE における LHT/RHT とレーン接続・ルート計算

> ルート推定実装の基礎資料。ASAM OpenDRIVE 1.6 仕様書と公式サンプル（`Thirdparty/opendrive/examples_and_use_cases/`）を一次ソースとして整理したもの。

## 1. 大原則

OpenDRIVE のジオメトリ層は **LHT/RHT について完全に中立**。

- レーン ID の符号規則、road/lane の `<predecessor>`/`<successor>` の書き方、`contactPoint` の意味、ジオメトリ計算 — **すべて LHT/RHT で共通**
- 違いは **走行方向の解釈** と **ジャンクション `<laneLink>` の張り方** のみ

`@rule` 属性（`road@rule="LHT"` / `"RHT"`）は、**レーン ID と s 軸方向の対応関係** を定義する属性であって、データ構造そのものは変えない。

## 2. レーン ID の幾何学的定義

ASAM OpenDRIVE 1.6 §9 より：

> The center lane itself has the lane number 0. The numbering of the other lanes starts at the center lane: Lane numbers descend to the right, meaning negative t-direction, and ascend to the left, meaning positive t-direction.

| 位置 | 要素 | ID | t 方向 |
|---|---|---|---|
| 参照線の左 | `<left>` | +1, +2, +3, ... | t > 0 |
| 参照線上 | `<center>` | 0 | t = 0 |
| 参照線の右 | `<right>` | -1, -2, -3, ... | t < 0 |

- 左右の「左」「右」は **参照線の s 軸進行方向から見た左右**（走行方向ではない）
- ID の絶対値は **参照線から外側に向かって増加**
- **LHT/RHT と無関係にこのルールは同じ**

## 3. @rule とレーン ID の走行方向対応

これが LHT/RHT の本質。

| rule | 負 ID レーン（右側） | 正 ID レーン（左側） |
|---|---|---|
| **RHT** | **+s 方向** に走行 | -s 方向に走行 |
| **LHT** | -s 方向に走行 | **+s 方向** に走行 |

### 導出

- +s 方向を向いたドライバーから見て、+t = 左、-t = 右（右手系）
- **RHT（右側通行）**：+s 方向ドライバーは -t 側（負 ID）を使う → 負 ID が +s 方向走行
- **LHT（左側通行）**：+s 方向ドライバーは +t 側（正 ID）を使う → 正 ID が +s 方向走行

### 重要な帰結

- **同じレーン ID の走行方向は LHT/RHT で逆転する**（例：レーン -1 は RHT で +s 方向、LHT で -s 方向）
- ただし **地理的に同じ方向へ進む場合、使う s 方向は LHT/RHT で同じ**（東へ進むなら両方 +s 方向。変わるのは使うレーン ID の符号）

## 4. 接続の 3 階層

### 階層 1: road 間接続（`<road><link>`）

```xml
<road id="1">
  <link>
    <predecessor elementType="road" elementId="99" contactPoint="end"/>
    <successor   elementType="junction" elementId="1"/>
  </link>
</road>
```

- `predecessor` = s=0 側で繋がる相手
- `successor` = s=length 側で繋がる相手
- `contactPoint`（相手が road のとき）= 相手の `start`（s=0）/`end`（s=length）のどちらに繋ぐか
- `elementType` = `"road"` または `"junction"`

### 階層 2: lane 間接続（`<lane><link>`）

```xml
<lane id="-1">
  <link>
    <predecessor id="-2"/>
    <successor   id="-1"/>
  </link>
</lane>
```

- 相手レーン（road link で示した相手 road のレーン）の ID を書く
- `start-to-start` / `end-to-end` 接続では **ID 符号がフリップする**（幾何学的理由。LHT/RHT とは無関係）
- `start-to-end` / `end-to-start`（通常の連結）では符号不変

### 階層 3: junction 内接続

junction 内は road の直接 link では表現できない（1 road が複数方向に繋がる）。専用構造：

```xml
<junction id="1">
  <connection id="0"
              incomingRoad="1"
              connectingRoad="10"
              contactPoint="start">
    <laneLink from="-1" to="1"/>
  </connection>
</junction>

<!-- connectingRoad は普通の road として別に定義される -->
<road id="10" junction="1">
  <link>
    <predecessor elementType="road" elementId="1" contactPoint="start"/>
    <successor   elementType="road" elementId="4" contactPoint="start"/>
  </link>
  ...
</road>
```

#### junction における重要事実

- `<connection>` には **入口（incomingRoad）情報のみ**。出口は connectingRoad の `<link>` を参照する必要がある
- `contactPoint` は **connectingRoad 側の接続端**
  - `contactPoint="start"` → connectingRoad の `<predecessor>` が incomingRoad、`<successor>` が出口
  - `contactPoint="end"` → connectingRoad の `<successor>` が incomingRoad、`<predecessor>` が出口
- `<laneLink>` も connectingRoad までしか示さない。出口 road のレーンは connectingRoad 内レーンの `<link>` を辿る
- **完全な経路を得るには 3 ホップ参照が必要**：incomingRoad lane → connectingRoad lane → outgoingRoad lane

## 5. LHT/RHT で張り方が変わるもの・変わらないもの

### 変わらない（ジオメトリ層）

| 項目 | LHT/RHT で同じ |
|---|---|
| レーン ID の符号規則（左=正/右=負） | ✓ |
| road の `<predecessor>`/`<successor>` | ✓ |
| lane の `<predecessor>`/`<successor>` の書き方 | ✓ |
| contactPoint の意味 | ✓ |
| connectingRoad の `<link>` | ✓ |

### 変わる（走行方向・経路列挙）

| 項目 | 変化 |
|---|---|
| 同一レーン ID の走行方向 | 符号対応が逆転 |
| junction `<connection>` の `incomingRoad` から見た `from` レーン | RHT: 正 ID が多い / LHT: 負 ID が多い（進入方向に使うレーンが鏡像） |
| junction `<laneLink>` の組み合わせ集合 | LHT/RHT で実質異なる |
| connectingRoad 側に定義するレーン | 走行方向のある片側だけ定義するのが実務慣行（LHT なら `<left>`、RHT なら `<right>`） |

## 6. 公式 LHT サンプルの参照ポイント

`Thirdparty/opendrive/examples_and_use_cases/` に 2 つの LHT サンプル：

### `Ex_LHT-Complex-X-Junction/`（ミニマル）

- 4 方向 X 字交差点、各 approach 3 レーン対称構成
- connectingRoad は 1 走行レーンずつ
- 初学者が構造を追うのに最適

### `UC_LHT_Complex-TrafficLights/`（実用的）

- 5/4 の非対称レーン構成、median（id=-1）、curb レーン（両端）あり
- `laneOffset` 使用、信号・コントローラの多重定義
- ターン種別ごとに異なるレーン数の connectingRoad
- **LHT での左折/直進/右折のレーン割り当て慣例**：
  - 左折 = 最外側右レーン（最も負、LHT で対向車線を横切らない）
  - 直進 = 中間レーン
  - 右折 = 内側右レーン（-2 相当、対向を横切る）
- ルート推定の golden reference として推奨

## 7. ルート計算への含意

### 「逆順に辿る」は誤り

物理的経路が同じなら、**road の traversal 順は LHT/RHT で同一**。以下は全て共通：
- road のトポロジー
- グラフ探索アルゴリズム
- predecessor/successor の辿り方
- s 軸方向の進行方向（物理的に同じ向きに進むなら同じ s 方向）

### 実際に分岐が必要な箇所

1. **レーン ID の符号選択**：走行方向（+s / -s）から使うレーン ID の符号を決める
2. **junction `<laneLink>` の from レーン解釈**：進入レーンの符号が rule 依存
3. **connectingRoad 内で使う側**：どちらの side（`<left>`/`<right>`）が走行レーンかの前提

### 実装パターン

```typescript
// 共通：road グラフ上の経路探索（LHT/RHT 非依存）
function findRoute(startWP: Waypoint, endWP: Waypoint, network: RoadNetwork): Road[] {
  return graphSearch(startWP.roadId, endWP.roadId, network);
}

// rule 依存：走行方向からレーン ID 符号を決める
function drivingLaneSign(sDirection: '+s' | '-s', rule: 'LHT' | 'RHT'): -1 | +1 {
  if (rule === 'LHT') {
    return sDirection === '+s' ? +1 : -1;
  } else {
    return sDirection === '+s' ? -1 : +1;
  }
}

// rule 依存：junction 内経路選択
function findConnectionFor(
  incomingRoad: RoadId,
  incomingLane: LaneId,
  desiredExit: RoadId,
  junction: Junction
): Connection | null {
  // <connection> を走査して matching incoming/outgoing を探す
  // 出口側は connectingRoad.<link> を参照（connection には出口情報がないため）
  for (const conn of junction.connections) {
    if (conn.incomingRoad !== incomingRoad) continue;
    const cr = getRoad(conn.connectingRoad);
    const exit = conn.contactPoint === 'start' ? cr.link.successor : cr.link.predecessor;
    if (exit.elementId === desiredExit) {
      // laneLink の from が incomingLane と一致するものを選択
      const laneLink = conn.laneLinks.find(ll => ll.from === incomingLane);
      if (laneLink) return conn;
    }
  }
  return null;
}

// rule 依存：connectingRoad 内レーンから出口 road のレーンへ
function tracedExitLane(
  cr: Road,
  connLane: LaneId,
  contactPoint: 'start' | 'end'
): LaneId {
  const lane = findLane(cr, connLane);
  // contactPoint="start" なら successor が出口側
  return contactPoint === 'start' ? lane.link.successor : lane.link.predecessor;
}
```

### フル経路 3 ホップ参照の例

```
incomingRoad road 1 lane -4  (LHT で -s 方向 = junction 向き)
     ↓ junction <connection laneLink from=-4 to=+1>
connectingRoad 70 lane +1
     ↓ connectingRoad 70 の lane +1 の <successor id=+3>
outgoingRoad road 4 lane +3  (LHT で +s 方向 = junction から離れる)
```

## 8. 実装チェックリスト（ルート推定修正時）

- [ ] `@rule` を road ごとに読み取り、デフォルトが RHT であることを確認（§8.1: 属性未指定時 RHT）
- [ ] `drivingLaneSign()` 相当の関数を用意し、ハードコードされた「-1 = 順方向」を排除
- [ ] junction の `<connection>` から出口 road を取得する際、必ず connectingRoad の `<link>` を参照
- [ ] `contactPoint` の `start`/`end` を正しく解釈（出口側を予測しない）
- [ ] lane の `<link>` で ID 符号がフリップするケース（start-to-start / end-to-end）を扱う
- [ ] junction `<laneLink>` の from/to を正しく辿り、そこから connectingRoad の lane `<link>` で出口レーンを取得
- [ ] LHT サンプル（`UC_LHT_Complex-TrafficLights.xodr`）で動作確認
- [ ] RHT サンプルでも同じロジックが動くことを確認（LHT 固有の分岐が紛れていないか）

## 9. 参考資料

- ASAM OpenDRIVE 1.6 仕様書: `Thirdparty/opendrive/Specification/ASAM_OpenDRIVE_BS_V1-6-0.html`
  - §4.4.1 Traffic direction（仕様書全体が RHT 前提である宣言）
  - §8.1 Road（`@rule` 属性）
  - §8.2 Road Linkage
  - §9 Lanes 冒頭（レーン番号付け）
  - §9.4 Lane linkage
  - §10 Junctions
- XSD: `Thirdparty/GT_Sim/resources/schema/OpenDRIVE_1.7/localSchema/`
- LHT サンプル: `Thirdparty/opendrive/examples_and_use_cases/Ex_LHT-Complex-X-Junction/`, `UC_LHT_Complex-TrafficLights/`
- esmini 実装: `Thirdparty/GT_Sim/EnvironmentSimulator/Modules/RoadManager/RoadManager.cpp`（`Road::GetLink()` 周辺）
