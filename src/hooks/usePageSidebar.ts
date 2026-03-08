import { useState } from 'react';

export const usePageSidebar = () => {
  const [dictionariesOpen, setDictionariesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return {
    dictionariesOpen,
    setDictionariesOpen,
    menuOpen,
    setMenuOpen,
  };
};
