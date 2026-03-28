import { ResolutionStrategy } from '../utils/sync';

interface SyncStatusProps {
  status: 'synced' | 'behind' | 'ahead' | 'conflict';
  lastSynced?: number;
  onStrategyChange?: (strategy: ResolutionStrategy) => void;
  currentStrategy?: ResolutionStrategy;
}

export default function SyncStatus({ 
  status, 
  lastSynced,
  onStrategyChange,
  currentStrategy = 'latest_wins'
}: SyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return { 
          icon: '✓', 
          text: '已同步', 
          color: 'text-green-400',
          bgColor: 'bg-green-900/30'
        };
      case 'behind':
        return { 
          icon: '↓', 
          text: '需要下载更新', 
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30'
        };
      case 'ahead':
        return { 
          icon: '↑', 
          text: '有本地更改待同步', 
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/30'
        };
      case 'conflict':
        return { 
          icon: '⚠', 
          text: '存在冲突', 
          color: 'text-red-400',
          bgColor: 'bg-red-900/30'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="p-3 bg-gray-800 rounded-lg">
      {/* Status Indicator */}
      <div className={`flex items-center gap-2 ${config.bgColor} p-2 rounded mb-3`}>
        <span className={`text-lg ${config.color}`}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
      </div>

      {/* Last Synced Time */}
      {lastSynced && (
        <p className="text-xs text-gray-500 mb-3">
          上次同步: {new Date(lastSynced).toLocaleString()}
        </p>
      )}

      {/* Conflict Resolution Strategy (only show when there's a conflict) */}
      {status === 'conflict' && onStrategyChange && (
        <div>
          <p className="text-xs text-gray-400 mb-2">冲突解决策略:</p>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="strategy"
                checked={currentStrategy === 'auto_merge'}
                onChange={() => onStrategyChange('auto_merge')}
                className="accent-blue-500"
              />
              <span className="text-gray-300">自动合并 (元数据)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="strategy"
                checked={currentStrategy === 'latest_wins'}
                onChange={() => onStrategyChange('latest_wins')}
                className="accent-blue-500"
              />
              <span className="text-gray-300">以最新为准</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="strategy"
                checked={currentStrategy === 'manual'}
                onChange={() => onStrategyChange('manual')}
                className="accent-blue-500"
              />
              <span className="text-gray-300">手动解决</span>
            </label>
          </div>
        </div>
      )}

      {/* Description */}
      {status !== 'conflict' && (
        <p className="text-xs text-gray-500">
          {status === 'synced' && '所有更改已同步到云端'}
          {status === 'behind' && '云端有更新，请同步'}
          {status === 'ahead' && '本地有更改等待上传'}
        </p>
      )}
    </div>
  );
}