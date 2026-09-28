import cn from '../../utils/cn.js';

const Tabs = ({ tabs = [], active, onChange, className }) => (
  <div className={cn('scrollbar-thin overflow-x-auto border-b border-ink-100', className)}>
    <div role="tablist" className="flex min-w-max gap-1">
      {tabs.map((tab) => {
        const showBadge = typeof tab.count === 'number' && (!tab.hideZero || tab.count > 0);
        const isPositive = typeof tab.count === 'number' && tab.count > 0;

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active === tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 flex items-center gap-1.5',
              active === tab.value
                ? 'border-brand-600 text-brand-700 font-bold'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            )}
          >
            <span>{tab.label}</span>
            {showBadge && (
              <span
                className={cn(
                  'tabular rounded-full px-2 py-0.5 text-xs font-bold transition-colors',
                  isPositive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-ink-100 text-ink-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default Tabs;
