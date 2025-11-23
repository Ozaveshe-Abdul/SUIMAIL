import { EnokiClient } from "@mysten/enoki";

export const ENOKI_PUBLIC_KEY = process.env.ENOKI_PUBLIC_KEY;

export const enokiClient = new EnokiClient({
    apiKey: ENOKI_PUBLIC_KEY!!,
});
