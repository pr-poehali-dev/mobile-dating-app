import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { QuickAction } from '@/types/dashboard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = ({ actions }: QuickActionsProps) => {
  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Быстрые действия</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => (
          <TooltipProvider key={action.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <Icon name={action.icon} className="h-6 w-6" />
                  <span className="text-xs text-center">{action.label}</span>
                </Button>
              </TooltipTrigger>
              {action.disabled && action.disabledReason && (
                <TooltipContent>
                  <p className="text-xs">{action.disabledReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
