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
            'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4',
            active === tab.value
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-500 hover:text-ink-800'
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="tabular ml-2 rounded-full bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default Tabs;
