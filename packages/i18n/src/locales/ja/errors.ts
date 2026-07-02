export const errors = {
  validation: {
    struct001: 'FileHeader に必須情報がありません',
    struct002: 'Storyboard は必須です',
    struct003: 'Story「{{name}}」に Act がありません',
    struct004: 'Act「{{name}}」の StartTrigger が空です',
    struct005: 'Event「{{name}}」の StartTrigger が空です',
    struct006: 'ManeuverGroup「{{name}}」にアクターがいません',
    struct007: 'エンティティ「{{name}}」に定義がありません',
    ref001: '{{location}} のエンティティ参照「{{ref}}」が定義済みエンティティと一致しません',
    ref003: 'パラメータ参照「{{ref}}」が宣言済みパラメータと一致しません',
    val001: '車両「{{name}}」の maxSpeed が負の値です',
    val003: 'エンティティ「{{name}}」のバウンディングボックス寸法が正の値ではありません',
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
