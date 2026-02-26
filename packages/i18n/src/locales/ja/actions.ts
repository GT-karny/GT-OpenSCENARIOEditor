export const actions = {
  speedAction: {
    name: '速度アクション',
    description: 'エンティティの速度を目標値に変更します',
    params: {
      targetSpeed: { name: '目標速度', description: '目標とする速度' },
      dynamicsShape: { name: '遷移形状', description: '速度遷移カーブの形状' },
      dynamicsDimension: { name: '遷移次元', description: '遷移値の解釈方法' },
      dynamicsValue: { name: '遷移値', description: '遷移パラメータの値' },
    },
  },
  laneChangeAction: {
    name: '車線変更アクション',
    description: '隣接車線に移動します',
    params: {
      targetLane: { name: '目標車線', description: '目標車線（相対または絶対）' },
      isRelative: { name: '相対指定', description: '車線指定が現在車線からの相対値かどうか' },
      referenceEntity: { name: '参照エンティティ', description: '相対車線参照のためのエンティティ' },
      dynamicsShape: { name: '遷移形状', description: '車線変更カーブの形状' },
      dynamicsDimension: { name: '遷移次元', description: '遷移値の解釈方法' },
      dynamicsValue: { name: '遷移値', description: '遷移パラメータの値' },
      targetLaneOffset: { name: '車線オフセット', description: '目標車線内の横方向オフセット' },
    },
  },
  teleportAction: {
    name: 'テレポートアクション',
    description: 'エンティティを指定位置に瞬間移動させます',
    params: {
      positionType: { name: '位置タイプ', description: '位置指定の種類' },
      roadId: { name: '道路ID', description: '道路の識別子' },
      laneId: { name: '車線ID', description: '車線の識別子' },
      s: { name: 'S座標', description: '道路に沿った位置' },
      offset: { name: 'オフセット', description: '車線内の横方向オフセット' },
      worldX: { name: 'ワールドX', description: 'ワールド空間のX座標' },
      worldY: { name: 'ワールドY', description: 'ワールド空間のY座標' },
      worldH: { name: '方位角', description: '方位角（ラジアン）' },
    },
  },
  longitudinalDistanceAction: {
    name: '縦方向距離アクション',
    description: '参照エンティティとの縦方向距離を維持します',
    params: {
      entityRef: { name: '参照エンティティ', description: '距離を維持する対象エンティティ' },
      distance: { name: '距離', description: '目標縦方向距離' },
      timeGap: { name: 'タイムギャップ', description: '目標タイムギャップ' },
      useTimeGap: { name: 'タイムギャップ使用', description: '距離の代わりにタイムギャップを使用' },
      freespace: { name: 'フリースペース', description: '距離をエッジ間で測定するかどうか' },
      continuous: { name: '連続', description: 'アクションを継続的に実行するかどうか' },
    },
  },
  lateralDistanceAction: {
    name: '横方向距離アクション',
    description: '参照エンティティとの横方向距離を維持します',
    params: {
      entityRef: { name: '参照エンティティ', description: '距離を維持する対象エンティティ' },
      distance: { name: '距離', description: '目標横方向距離' },
      freespace: { name: 'フリースペース', description: '距離をエッジ間で測定するかどうか' },
      continuous: { name: '連続', description: 'アクションを継続的に実行するかどうか' },
    },
  },
  followTrajectoryAction: {
    name: '軌跡追従アクション',
    description: '定義済みの軌跡に沿って移動します',
    params: {
      trajectoryName: { name: '軌跡名', description: '軌跡の名前' },
      closed: { name: '閉ループ', description: '軌跡が閉じたループを形成するかどうか' },
      followingMode: { name: '追従モード', description: 'エンティティが軌跡に追従する方法' },
      useTimingReference: { name: 'タイミング使用', description: 'タイミング参照を使用するかどうか' },
    },
  },
} as const;
