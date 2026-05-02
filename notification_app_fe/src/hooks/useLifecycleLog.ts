import { useEffect } from 'react';
import { Log } from '../../../logging_middleware/log';
import type { LogPackage } from '../../../logging_middleware/log';

export function useLifecycleLog(packageName: LogPackage, name: string): void {
  useEffect(() => {
    void Log('frontend', 'info', packageName, `${name} mounted and is ready for interaction.`);

    return () => {
      void Log('frontend', 'info', packageName, `${name} unmounted and released its UI listeners.`);
    };
  }, [name, packageName]);
}
