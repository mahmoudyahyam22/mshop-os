
import React from 'react';

interface PageHeaderProps {
    title: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
    return (
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-[var(--border-glow)]">
            <h2 className="text-3xl font-bold text-[var(--accent-cyan)] drop-shadow-[0_0_8px_var(--accent-cyan)]">{title}</h2>
            {children && <div className="flex items-center gap-4 flex-wrap">{children}</div>}
        </div>
    );
};

export default PageHeader;