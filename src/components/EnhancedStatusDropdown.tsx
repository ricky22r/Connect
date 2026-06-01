import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Clock,
  CheckCircle2,
  PhoneMissed,
  XCircle,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'Not Connected',
    label: 'Not Connected',
    icon: <PhoneMissed className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Could not reach customer'
  },
  {
    value: 'Not Interested',
    label: 'Not Interested',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    description: 'Customer declined offer'
  },
  {
    value: 'Interested',
    label: 'Interested',
    icon: <Phone className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Customer showed interest'
  },
  {
    value: 'Follow-up',
    label: 'Follow-up Required',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Schedule next call'
  },
  {
    value: 'Complete',
    label: 'Closed / Complete',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Sale completed'
  },
];

interface EnhancedStatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowedRoles?: string[];
  currentRole?: string;
}

const EnhancedStatusDropdown: React.FC<EnhancedStatusDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  showDescription = false,
  size = 'md',
  allowedRoles = ['admin', 'field_boy'],
  currentRole = 'employee',
}) => {
  const currentStatus = STATUS_OPTIONS.find(s => s.value === value);
  const availableOptions = STATUS_OPTIONS.filter(option => {
    // Employees can't mark as Complete
    if (currentRole === 'employee' && option.value === 'Complete') {
      return false;
    }
    return true;
  });

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  return (
    <div className="w-full space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full border-2 transition-all font-medium focus:ring-2 focus:ring-offset-1',
            sizeClasses[size],
            currentStatus?.bgColor,
            currentStatus?.color,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2 w-full">
            {currentStatus && <>{currentStatus.icon}</> }
            <SelectValue placeholder="Select status..." />
          </div>
        </SelectTrigger>
        <SelectContent className="w-full">
          {availableOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                'cursor-pointer py-2.5 px-3 rounded-md transition-all hover:bg-slate-100',
                option.bgColor
              )}
            >
              <div className="flex items-center gap-2">
                <div className={option.color}>
                  {option.icon}
                </div>
                <div>
                  <p className="font-semibold">{option.label}</p>
                  {showDescription && (
                    <p className="text-xs text-slate-500">{option.description}</p>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Guide Card */}
      {showDescription && (
        <div className={cn(
          'p-3 rounded-lg border-2 flex gap-2.5',
          currentStatus?.bgColor,
          currentStatus?.color,
          'border-opacity-30 border-current'
        )}>
          <div className="mt-0.5">{currentStatus?.icon}</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">{currentStatus?.label}</p>
            <p className="text-xs opacity-75">{currentStatus?.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStatusDropdown;
export { STATUS_OPTIONS };
