/**
 * Hook personnalisé pour la sélection de templates
 * Gère la logique métier de sélection/désélection des templates
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { templateService } from '@core/services';

export interface UseTemplateSelectionReturn {
  // Data
  templates: string[];
  selectedTemplateNames: string[];
  selectedTemplates: string[];

  // Loading states
  isLoading: boolean;
  error: Error | null;

  // Actions
  toggleTemplate: (name: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (name: string) => boolean;

  // Computed
  hasSelection: boolean;
  selectionCount: number;
}

/**
 * Hook pour gérer la sélection de templates
 */
export function useTemplateSelection(): UseTemplateSelectionReturn {
  // State local pour la sélection
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  // Récupération des templates via React Query
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplateNames(),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Toggle un template (immutable)
  const toggleTemplate = useCallback((name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // Sélectionner tous les templates
  const selectAll = useCallback(() => {
    setSelectedNames(new Set(templates));
  }, [templates]);

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    setSelectedNames(new Set());
  }, []);

  // Vérifier si un template est sélectionné
  const isSelected = useCallback(
    (name: string) => selectedNames.has(name),
    [selectedNames]
  );

  // Valeurs calculées (memoized)
  const selectedTemplateNames = useMemo(
    () => Array.from(selectedNames),
    [selectedNames]
  );

  const selectedTemplates = useMemo(
    () => templates.filter((t) => selectedNames.has(t)),
    [templates, selectedNames]
  );

  const hasSelection = selectedNames.size > 0;
  const selectionCount = selectedNames.size;

  return {
    templates,
    selectedTemplateNames,
    selectedTemplates,
    isLoading,
    error,
    toggleTemplate,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection,
    selectionCount,
  };
}
