import { useDictionaryContext } from '@/contexts/DictionaryContext';

type DictionaryKey = 'categories' | 'contractors' | 'legalEntities' | 'departments' | 'services' | 'customFields' | 'users';

export const useDictionary = (key: DictionaryKey) => {
  const context = useDictionaryContext();
  
  return {
    data: context[key],
    loading: context.loading[key],
    refresh: () => context.refresh(key),
  };
};
