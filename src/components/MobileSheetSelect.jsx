import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

// Renders the standard Select popover on desktop, and an iOS-style action-sheet Drawer on mobile (<768px).
// `options` is an array of strings OR { value, label } objects. Matches the Select API (value, onValueChange).
export function MobileSheetSelect({ value, onValueChange, options, placeholder, triggerClassName }) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const norm = options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt));

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {norm.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const currentLabel = norm.find((o) => o.value === value)?.label ?? value;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            triggerClassName
          )}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{currentLabel || placeholder || 'Select'}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[75vh]">
        <DrawerHeader className="pb-2 text-center">
          <DrawerTitle className="text-base">{placeholder || 'Select an option'}</DrawerTitle>
        </DrawerHeader>
        <div className="px-2 pb-6 overflow-y-auto max-h-[55vh]">
          {norm.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-3.5 rounded-lg text-sm font-medium transition-colors active:bg-stone-100',
                  active ? 'bg-teal-50 text-teal-700' : 'hover:bg-stone-50 text-stone-700'
                )}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default MobileSheetSelect;