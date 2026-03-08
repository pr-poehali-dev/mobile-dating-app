import Icon from '@/components/ui/icon';
import NotificationBell from '@/components/notifications/NotificationBell';

interface PaymentsHeaderProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const PaymentsHeader = ({ menuOpen, setMenuOpen }: PaymentsHeaderProps) => {
  return (
    <header className="flex justify-between items-center gap-4 mb-6 md:mb-[30px] px-4 md:px-[25px] py-4 md:py-[18px] bg-[#1b254b]/50 backdrop-blur-[20px] rounded-[15px] border border-white/10">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="lg:hidden p-2 text-white"
      >
        <Icon name="Menu" size={24} />
      </button>
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <NotificationBell />
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-[15px] py-2 md:py-[10px] rounded-[12px] bg-white/5 border border-white/10">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-[10px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white text-sm md:text-base">
            А
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">Администратор</div>
            <div className="text-xs text-muted-foreground">Администратор</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PaymentsHeader;