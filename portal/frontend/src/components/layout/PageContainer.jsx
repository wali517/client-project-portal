import cn from '../../utils/cn.js';

const PageContainer = ({ children, className }) => (
  <div className={cn('mx-auto w-full max-w-7xl px-4 py-5 sm:px-4 sm:py-6 lg:px-8', className)}>{children}</div>
);

export default PageContainer;
