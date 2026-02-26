export const tooltips = {
  panels: {
    templates: 'シナリオテンプレートをドラッグ＆ドロップして素早くシナリオを構築',
    nodeEditor: 'シナリオ構造のビジュアル表現',
    properties: '選択した要素のプロパティを編集',
    entityList: 'シナリオエンティティの管理（車両、歩行者、オブジェクト）',
    timeline: 'イベントの時系列表示と編集',
    validation: 'バリデーション結果の確認と修正',
    simulation: 'シナリオシミュレーションの設定と実行',
    '3dViewer': 'シナリオの3Dプレビュー',
  },
  parameters: {
    speedGauge: 'ゲージで速度を調整',
    distanceLine: 'ラインをドラッグして距離を設定',
    laneSelector: '車線をクリックして選択',
    positionPicker: 'マップ上をクリックして位置を設定',
    angleArc: 'アークをドラッグして角度を調整',
    timeDuration: '時間の長さを設定',
    slider: 'スライダーをドラッグして値を調整',
    entitySelector: 'リストからエンティティを選択',
  },
  actions: {
    decompose: 'このテンプレートをOpenSCENARIO要素に変換',
    addTemplate: '新しいシナリオテンプレートを追加',
    removeTemplate: 'このテンプレートをシナリオから削除',
    editParameters: 'テンプレートパラメータを編集',
  },
} as const;
