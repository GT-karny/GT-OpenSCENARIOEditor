# esmini C-API 拡張提案: 信号状態取得 API

## 背景

OpenSCENARIO エディタのシミュレーション再生中に、交通信号機の現在の状態（赤/黄/緑）を 3D ビューアに反映したい。
位置情報は既存の `SE_GetRoadSign()` で取得可能だが、OpenSCENARIO の `TrafficSignalStateAction` で設定された **状態文字列** を C-API から取得する手段がない。

## 現状

### 利用可能な C-API

| 関数 | 説明 |
|------|------|
| `SE_GetNumberOfRoads()` | 道路数を取得 |
| `SE_GetRoadIdByIdx(r)` | インデックスから道路 ID を取得 |
| `SE_GetNumberOfRoadSigns(road_id)` | 指定道路の信号数を取得 |
| `SE_GetRoadSign(road_id, index, &sign)` | 信号の詳細（id, name, x, y, z, h, s, t 等）を取得 |

### 不足している機能

- `SE_RoadSign` 構造体に `state` フィールドがない
- C++ 内部の `Signal::GetStateString()` でのみ状態文字列を取得可能
- 外部から信号の現在状態にアクセスする API がない

## 提案

### 提案1: 新規関数 `SE_GetRoadSignState()`

```c
/**
 * シミュレーション中に OpenSCENARIO TrafficSignalStateAction で設定された
 * 信号の現在の状態文字列を取得する。
 *
 * @param road_id     道路 ID
 * @param index       信号インデックス（0 〜 SE_GetNumberOfRoadSigns(road_id)-1）
 * @param state       状態文字列の出力バッファ
 * @param bufferSize  バッファサイズ
 * @return 0: 成功, -1: エラー（無効な road_id/index）
 */
int SE_GetRoadSignState(int road_id, int index, char* state, int bufferSize);
```

#### 内部実装イメージ

```cpp
int SE_GetRoadSignState(int road_id, int index, char* state, int bufferSize) {
    roadmanager::Road* road = roadmanager::Position::GetOpenDrive()->GetRoadById(road_id);
    if (!road || index >= road->GetNumberOfSignals()) return -1;
    roadmanager::Signal* signal = road->GetSignal(index);
    strncpy(state, signal->GetStateString().c_str(), bufferSize - 1);
    state[bufferSize - 1] = '\0';
    return 0;
}
```

### 提案2: Emscripten embind での公開

WASM ビルドで上記関数をブラウザから呼び出せるようにする:

```cpp
// JS 向けラッパー（string を直接返す）
std::string SE_GetRoadSignState_JS(int road_id, int index) {
    char state[128];
    if (SE_GetRoadSignState(road_id, index, state, sizeof(state)) == 0) {
        return std::string(state);
    }
    return "";
}

// embind 登録
EMSCRIPTEN_BINDINGS(esmini_signals) {
    function("SE_GetRoadSignState", &SE_GetRoadSignState_JS);
}
```

以下の既存関数も embind で公開が必要（未公開の場合）:

| 関数 | 用途 |
|------|------|
| `SE_GetNumberOfRoads()` | 全道路ループ用 |
| `SE_GetRoadIdByIdx(r)` | 道路 ID 取得 |
| `SE_GetNumberOfRoadSigns(road_id)` | 道路ごとの信号数 |
| `SE_GetRoadSign(road_id, index, &sign)` | 信号の基本情報（位置等） |

`SE_GetRoadSign` は `SE_RoadSign` 構造体を返すため、JS 向けに個別フィールドを返すラッパーか、JSON 文字列を返すラッパーが必要。

## 利用シナリオ

```js
// ブラウザ WASM 環境での利用（疑似コード）
function getTrafficSignalStates(Module) {
    const signalStates = [];
    const numRoads = Module.SE_GetNumberOfRoads();
    for (let r = 0; r < numRoads; r++) {
        const roadId = Module.SE_GetRoadIdByIdx(r);
        const numSigns = Module.SE_GetNumberOfRoadSigns(roadId);
        for (let i = 0; i < numSigns; i++) {
            const state = Module.SE_GetRoadSignState(roadId, i);
            if (state) {
                signalStates.push({ roadId, index: i, state });
            }
        }
    }
    return signalStates;
}
```

シミュレーションの各ステップでこの関数を呼び出し、3D ビューアの信号色（赤/黄/緑の emissive マテリアル）をリアルタイム更新する。

## 優先度

**高**: この API がないとブラウザ版シミュレーション再生時の信号状態表示が実装できない。