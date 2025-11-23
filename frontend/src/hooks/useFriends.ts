import { useState, useEffect } from "react";
import {Friend, getFriends,} from "../services/friendsStore";

export function useFriends(address: string) {
    // Initialize state with current data from local storage
    const [friends, setFriends] = useState<Friend[]>(getFriends(address));

    useEffect(() => {
        // Handler to reload data when the store updates
        const handleUpdate = () => {
            setFriends(getFriends(address));
        };

        // Listen for the custom event dispatched by your store
        window.addEventListener("friendsUpdated", handleUpdate);

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener("friendsUpdated", handleUpdate);
        };
    }, []);

    return friends;
}
