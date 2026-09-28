import cn from '../../utils/cn.js';

const Tabs = ({ tabs = [], active, onChange, className }) => (
  <div className={cn('scrollbar-thin overflow-x-auto border-b border-ink-100', className)}>
    <div role="tablist" className="flex min-w-max gap-1">
      {tabs.map((tab) => (
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
          {typeof tab.count === 'number' && (
            <span className="tabular rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default Tabs;
