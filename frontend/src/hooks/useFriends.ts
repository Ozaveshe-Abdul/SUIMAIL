import { useState, useEffect } from "react";
import { loadFriendsList, type FriendsList } from "../services/friendsStore";

export function useFriends() {
    // Initialize state with current data from local storage
    const [friends, setFriends] = useState<FriendsList>(loadFriendsList());

    useEffect(() => {
        // Handler to reload data when the store updates
        const handleUpdate = () => {
            setFriends(loadFriendsList());
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
