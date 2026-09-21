import cn from '../../utils/cn.js';

export const Card = ({ className, children, ...props }) => (
  <section className={cn('card', className)} {...props}>
    {children}
  </section>
);

export const CardHeader = ({ title, description, action, className }) => (
  <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5', className)}>
    <div>
      <h2 className="text-sm font-semibold text-ink-900 sm:text-base">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
    </div>
    {action}
  </div>
);

export const CardBody = ({ className, children }) => <div className={cn('px-4 py-4 sm:px-5', className)}>{children}</div>;

export default Card;
