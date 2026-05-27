import React from 'react';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({children}) => {
    return (
        <div className="min-vh-100 bg-body text-body">
            {children}
        </div>
    );
};

export default AppLayout;
