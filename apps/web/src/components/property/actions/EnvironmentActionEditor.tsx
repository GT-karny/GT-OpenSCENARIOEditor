import type { ScenarioAction, EnvironmentAction, Weather } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EnumSelect } from '../EnumSelect';
import { SegmentedControl } from '../SegmentedControl';

interface EnvironmentActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

const FRACTIONAL_CLOUD_COVER_OPTIONS = [
  'zeroOktas',
  'oneOkta',
  'twoOktas',
  'threeOktas',
  'fourOktas',
  'fiveOktas',
  'sixOktas',
  'sevenOktas',
  'eightOktas',
  'nineOktasOrMore',
  'skyObscured',
] as const;

const PRECIPITATION_TYPES = ['dry', 'rain', 'snow'] as const;

const WETNESS_OPTIONS = ['dry', 'moist', 'wetWithPuddles', 'lowFlooded', 'highFlooded'] as const;

export function EnvironmentActionEditor({ action, onUpdate }: EnvironmentActionEditorProps) {
  const inner = action.action as EnvironmentAction;
  const env = inner.environment;

  const updateEnv = (updates: Partial<typeof env>) => {
    onUpdate({
      action: { ...inner, environment: { ...env, ...updates } },
    } as Partial<ScenarioAction>);
  };

  const updateWeather = (updates: Partial<Weather>) => {
    updateEnv({ weather: { ...env.weather, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-1">
        <Label className="text-xs">Environment Name</Label>
        <Input
          value={env.name}
          placeholder="environment name"
          onChange={(e) => updateEnv({ name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Time of Day */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground border-b pb-1">Time of Day</p>
        <div className="grid gap-1">
          <Label className="text-xs">Date & Time</Label>
          <Input
            type="datetime-local"
            step={1}
            value={env.timeOfDay.dateTime.slice(0, 19)}
            onChange={(e) => updateEnv({ timeOfDay: { ...env.timeOfDay, dateTime: e.target.value } })}
            className="h-8 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={env.timeOfDay.animation}
            onChange={(e) => updateEnv({ timeOfDay: { ...env.timeOfDay, animation: e.target.checked } })}
          />
          Animated Time
        </label>
      </div>

      {/* Weather */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground border-b pb-1">Weather</p>
        <div className="grid gap-1">
          <Label className="text-xs">Cloud Cover</Label>
          <EnumSelect
            value={env.weather.fractionalCloudCover ?? 'zeroOktas'}
            options={[...FRACTIONAL_CLOUD_COVER_OPTIONS]}
            onValueChange={(v) => updateWeather({ fractionalCloudCover: v })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">Pressure (Pa)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.environment.weather.atmosphericPressure"
              value={env.weather.atmosphericPressure ?? ''}
              placeholder="--"
              onValueChange={(v) => {
                const n = parseFloat(v);
                if (isNaN(n) || v === '') {
                  const { atmosphericPressure: _, ...rest } = env.weather;
                  updateEnv({ weather: rest });
                } else {
                  updateWeather({ atmosphericPressure: n });
                }
              }}
              acceptedTypes={['double']}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Temperature (K)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.environment.weather.temperature"
              value={env.weather.temperature ?? ''}
              placeholder="--"
              onValueChange={(v) => {
                const n = parseFloat(v);
                if (isNaN(n) || v === '') {
                  const { temperature: _, ...rest } = env.weather;
                  updateEnv({ weather: rest });
                } else {
                  updateWeather({ temperature: n });
                }
              }}
              acceptedTypes={['double']}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Sun */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Sun</p>
          <div className="grid grid-cols-3 gap-1">
            {(['intensity', 'azimuth', 'elevation'] as const).map((field) => {
              const unitMap = { intensity: 'W/m²', azimuth: 'rad', elevation: 'rad' } as const;
              return (
              <div key={field} className="grid gap-1">
                <Label className="text-[10px] capitalize">{field} ({unitMap[field]})</Label>
                <ParameterAwareInput
                  elementId={action.id}
                  fieldName={`action.environment.weather.sun.${field}`}
                  value={env.weather.sun?.[field] ?? ''}
                  placeholder="--"
                  onValueChange={(v) => {
                    const n = parseFloat(v);
                    if (isNaN(n) || v === '') {
                      if (env.weather.sun) {
                        const { [field]: _, ...rest } = env.weather.sun;
                        updateWeather({ sun: Object.keys(rest).length > 0 ? rest as typeof env.weather.sun : undefined });
                      }
                    } else {
                      updateWeather({ sun: { intensity: 0, azimuth: 0, elevation: 0, ...env.weather.sun, [field]: n } });
                    }
                  }}
                  acceptedTypes={['double']}
                  className="h-7 text-xs"
                />
              </div>
              );
            })}
          </div>
        </div>

        {/* Fog */}
        <div className="grid gap-1">
          <Label className="text-xs">Fog Visual Range (m)</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.environment.weather.fog.visualRange"
            value={env.weather.fog?.visualRange ?? ''}
            placeholder="--"
            onValueChange={(v) => {
              const n = parseFloat(v);
              if (isNaN(n) || v === '') {
                const { fog: _, ...rest } = env.weather;
                updateEnv({ weather: rest });
              } else {
                updateWeather({ fog: { ...env.weather.fog, visualRange: n } });
              }
            }}
            acceptedTypes={['double']}
            className="h-8 text-sm"
          />
        </div>

        {/* Precipitation */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Precipitation</p>
          <SegmentedControl
            value={env.weather.precipitation?.precipitationType ?? 'dry'}
            options={PRECIPITATION_TYPES}
            onValueChange={(v) =>
              updateWeather({
                precipitation: { precipitationType: v, precipitationIntensity: env.weather.precipitation?.precipitationIntensity ?? 0 },
              })
            }
            labels={{ dry: 'Dry', rain: 'Rain', snow: 'Snow' }}
          />
          <div className="grid gap-1">
            <Label className="text-xs">Intensity (0–1)</Label>
            <ParameterAwareInput
              elementId={action.id}
              fieldName="action.environment.weather.precipitation.precipitationIntensity"
              value={env.weather.precipitation?.precipitationIntensity ?? ''}
              placeholder="--"
              onValueChange={(v) => {
                const n = parseFloat(v);
                updateWeather({
                  precipitation: {
                    precipitationType: env.weather.precipitation?.precipitationType ?? 'dry',
                    precipitationIntensity: isNaN(n) ? 0 : n,
                  },
                });
              }}
              acceptedTypes={['double']}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Wind */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Wind</p>
          <div className="grid grid-cols-2 gap-1">
            <div className="grid gap-1">
              <Label className="text-xs">Direction (rad)</Label>
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.environment.weather.wind.direction"
                value={env.weather.wind?.direction ?? ''}
                placeholder="--"
                onValueChange={(v) => {
                  const n = parseFloat(v);
                  if (isNaN(n) || v === '') {
                    const { wind: _, ...rest } = env.weather;
                    updateEnv({ weather: rest });
                  } else {
                    updateWeather({ wind: { direction: n, speed: env.weather.wind?.speed ?? 0 } });
                  }
                }}
                acceptedTypes={['double']}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Speed (m/s)</Label>
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.environment.weather.wind.speed"
                value={env.weather.wind?.speed ?? ''}
                placeholder="--"
                onValueChange={(v) => {
                  const n = parseFloat(v);
                  if (isNaN(n) || v === '') {
                    const { wind: _, ...rest } = env.weather;
                    updateEnv({ weather: rest });
                  } else {
                    updateWeather({ wind: { direction: env.weather.wind?.direction ?? 0, speed: n } });
                  }
                }}
                acceptedTypes={['double']}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Road Condition */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground border-b pb-1">Road Condition</p>
        <div className="grid gap-1">
          <Label className="text-xs">Friction Scale Factor</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="action.environment.roadCondition.frictionScaleFactor"
            value={env.roadCondition.frictionScaleFactor}
            onValueChange={(v) =>
              updateEnv({
                roadCondition: { ...env.roadCondition, frictionScaleFactor: parseFloat(v) || 1 },
              })
            }
            acceptedTypes={['double']}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Wetness (optional)</Label>
          <EnumSelect
            value={env.roadCondition.wetness ?? ''}
            options={['', ...WETNESS_OPTIONS]}
            onValueChange={(v) => {
              if (v === '') {
                const { wetness: _, ...rest } = env.roadCondition;
                updateEnv({ roadCondition: rest });
              } else {
                updateEnv({ roadCondition: { ...env.roadCondition, wetness: v } });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
