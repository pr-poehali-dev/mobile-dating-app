import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ServicesHeaderProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onCreateClick: () => void;
}

const ServicesHeader = ({ menuOpen, setMenuOpen, onCreateClick }: ServicesHeaderProps) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-white"
        >
          <Icon name="Menu" size={24} />
        </button>
        <h1 className="text-2xl font-bold">Сервисы</h1>
      </div>

      <Button onClick={onCreateClick}>
        <Icon name="Plus" size={18} className="mr-2" />
        Создать сервис
      </Button>
    </header>
  );
};

export default ServicesHeader;
