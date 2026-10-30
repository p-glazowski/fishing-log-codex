import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../ui/button';

const ChangesContext = createContext<(id: string, dirty: boolean) => void>(() => {});

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const entries = useRef(new Set<string>());
  const register = useCallback((id: string, dirty: boolean) => {
    if (dirty) entries.current.add(id);
    else entries.current.delete(id);
  }, []);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      entries.current.size > 0 && currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload(
    useCallback((event) => {
      if (!entries.current.size) return;
      event.preventDefault();
      event.returnValue = '';
    }, []),
  );
  return (
    <ChangesContext.Provider value={register}>
      {children}
      <AlertDialog.Root open={blocker.state === 'blocked'}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="dialog">
            <AlertDialog.Title>{t('Leave without saving?')}</AlertDialog.Title>
            <AlertDialog.Description>
              {t('Your changes have not been saved.')}
            </AlertDialog.Description>
            <div className="dialog-actions">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" onClick={() => blocker.reset?.()}>
                  {t('Keep editing')}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="destructive" onClick={() => blocker.proceed?.()}>
                  {t('Discard changes')}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ChangesContext.Provider>
  );
}

export function useUnsavedChanges(dirty: boolean) {
  const id = useId();
  const register = useContext(ChangesContext);
  useEffect(() => {
    register(id, dirty);
    return () => register(id, false);
  }, [id, dirty, register]);
  return () => register(id, false);
}
