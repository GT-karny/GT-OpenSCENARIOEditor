export const errors = {
  validation: {
    entityNameDuplicate: 'エンティティ名「{{name}}」は既に使用されています',
    missingRoadNetwork: '道路ネットワークファイルが指定されていません',
    invalidParameter: 'パラメータ「{{param}}」の値が無効です: {{value}}',
    emptyStoryboard: 'ストーリーボードにストーリーが定義されていません',
    missingTrigger: 'イベント「{{event}}」に開始トリガーがありません',
    circularEntityRef: '循環エンティティ参照が検出されました: {{ref}}',
    missingEntityRef: '参照されたエンティティ「{{ref}}」が存在しません',
    invalidPosition: '無効な位置指定です',
    speedOutOfRange: '速度 {{value}} が有効範囲外です（{{min}} ～ {{max}}）',
    missingActor: 'マニューバグループ「{{group}}」にアクターが割り当てられていません',
  },
  parse: {
    invalidXml: '無効なXML形式です',
    unsupportedVersion: 'OpenSCENARIOバージョン {{version}} はサポートされていません',
    missingRequired: '必須要素「{{element}}」が見つかりません',
    invalidAttribute: '要素「{{element}}」の属性「{{attr}}」が無効です',
    malformedDocument: 'OpenSCENARIOドキュメントの形式が不正です',
  },
  runtime: {
    simulationFailed: 'シミュレーション失敗: {{reason}}',
    fileNotFound: 'ファイルが見つかりません: {{path}}',
    connectionLost: 'シミュレーションとの接続が切断されました',
    exportFailed: 'エクスポート失敗: {{reason}}',
    importFailed: 'インポート失敗: {{reason}}',
  },
} as const;
