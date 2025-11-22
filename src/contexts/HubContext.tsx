import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Hub, HubMember } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthContext';

interface HubContextType {
    currentHub: Hub | null;
    userHubs: Hub[];
    isLoading: boolean;
    selectHub: (hubId: string) => void;
}

const HubContext = createContext<HubContextType | undefined>(undefined);

export function HubProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [currentHub, setCurrentHub] = useState<Hub | null>(null);
    const [userHubs, setUserHubs] = useState<Hub[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserHubs();
        } else {
            setUserHubs([]);
            setCurrentHub(null);
            setIsLoading(false);
        }
    }, [user]);

    const fetchUserHubs = async () => {
        try {
            setIsLoading(true);
            // Fetch hubs where the user is a member
            const { data: members, error: memberError } = await supabase
                .from('hub_members')
                .select('hub_id, role')
                .eq('user_id', user!.id);

            if (memberError) throw memberError;

            if (members && members.length > 0) {
                const hubIds = members.map(m => m.hub_id);
                const { data: hubs, error: hubsError } = await supabase
                    .from('hubs')
                    .select('*')
                    .in('id', hubIds);

                if (hubsError) throw hubsError;

                setUserHubs(hubs || []);

                // Restore selected hub from local storage or default to the first one
                const savedHubId = localStorage.getItem('selectedHubId');
                const foundHub = hubs?.find(h => h.id === savedHubId) || hubs?.[0] || null;

                setCurrentHub(foundHub);
                if (foundHub) {
                    localStorage.setItem('selectedHubId', foundHub.id);
                }
            } else {
                setUserHubs([]);
                setCurrentHub(null);
            }
        } catch (error) {
            console.error('Error fetching hubs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectHub = (hubId: string) => {
        const hub = userHubs.find(h => h.id === hubId);
        if (hub) {
            setCurrentHub(hub);
            localStorage.setItem('selectedHubId', hub.id);
            // Optionally reload or trigger a re-fetch of data dependent on hub
            window.location.reload(); // Simple way to ensure all queries re-run with new hub context if we used it in queries
        }
    };

    return (
        <HubContext.Provider value={{ currentHub, userHubs, isLoading, selectHub }}>
            {children}
        </HubContext.Provider>
    );
}

export function useHub() {
    const context = useContext(HubContext);
    if (context === undefined) {
        throw new Error('useHub must be used within a HubProvider');
    }
    return context;
}
