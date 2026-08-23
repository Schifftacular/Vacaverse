import React, { createContext, useContext, useState } from 'react';

interface FeedbackContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Lets other surfaces (Profile's "Help & Support" row — see issue #8) open
// the existing feedback panel instead of each building their own separate
// "contact us" mechanism.
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <FeedbackContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
            {children}
        </FeedbackContext.Provider>
    );
};

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (context === undefined) throw new Error('useFeedback must be used within a FeedbackProvider');
    return context;
};
