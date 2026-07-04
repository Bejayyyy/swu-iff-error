import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  roleDefinitionsToMap,
  seedDefaultRoleDefinitions,
  subscribeRoleDefinitions,
} from '../services/roleDefinitionService';

const RoleConfigContext = createContext(null);

export function RoleConfigProvider({ children }) {
  const [roleDefinitionsList, setRoleDefinitionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seedAttemptedRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeRoleDefinitions(
      async (list) => {
        if (!list.length && !seedAttemptedRef.current) {
          seedAttemptedRef.current = true;
          try {
            await seedDefaultRoleDefinitions();
            return;
          } catch (err) {
            setError(err.message || 'Failed to initialize role definitions.');
            setLoading(false);
          }
        }
        setRoleDefinitionsList(list);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Failed to load role definitions.');
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const roleDefinitions = useMemo(
    () => roleDefinitionsToMap(roleDefinitionsList),
    [roleDefinitionsList],
  );

  const value = useMemo(
    () => ({
      roleDefinitions,
      roleDefinitionsList,
      loading,
      error,
    }),
    [roleDefinitions, roleDefinitionsList, loading, error],
  );

  return (
    <RoleConfigContext.Provider value={value}>
      {children}
    </RoleConfigContext.Provider>
  );
}

export function useRoleConfig() {
  const ctx = useContext(RoleConfigContext);
  if (!ctx) {
    return { roleDefinitions: {}, roleDefinitionsList: [], loading: false, error: '' };
  }
  return ctx;
}
