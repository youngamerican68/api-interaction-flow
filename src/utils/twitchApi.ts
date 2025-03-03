
import { toast } from "sonner";

// Twitch API endpoints
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

// Your hardcoded Twitch API credentials (replace these with your actual credentials)
const HARDCODED_CLIENT_ID = 'your_client_id_here';
const HARDCODED_CLIENT_SECRET = 'your_client_secret_here';

// Types for Twitch API responses
interface TwitchAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

// Store the auth token and its expiration
let authToken: string | null = null;
let tokenExpiration: number | null = null;

/**
 * Get the Twitch API authentication token
 */
export const getTwitchAuthToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (authToken && tokenExpiration && Date.now() < tokenExpiration) {
    return authToken;
  }

  try {
    // Check if we're using hardcoded keys
    const useHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
    const isPublicClient = localStorage.getItem('is_public_client') === 'true';
    
    let clientId, clientSecret;
    
    if (useHardcodedKeys) {
      // Use the hardcoded credentials
      clientId = HARDCODED_CLIENT_ID;
      clientSecret = HARDCODED_CLIENT_SECRET;
      
      // Validate hardcoded credentials
      if (clientId === 'your_client_id_here' || clientSecret === 'your_client_secret_here') {
        throw new Error('The application is configured to use built-in API credentials, but they have not been set. Please contact the administrator.');
      }
    } else {
      // Get client ID and secret from local storage (user provided)
      clientId = localStorage.getItem('twitch_client_id');
      
      if (!isPublicClient) {
        clientSecret = localStorage.getItem('twitch_client_secret');
      }
    }

    if (!clientId) {
      throw new Error('Twitch API credentials not found. Please set them in the settings.');
    }

    let authParams;
    let url = TWITCH_AUTH_URL;

    if (isPublicClient && !useHardcodedKeys) {
      // For public clients, use the client credentials without a secret
      // Note: This actually uses the client credentials flow with no secret
      authParams = new URLSearchParams({
        client_id: clientId,
        grant_type: 'client_credentials'
      });
    } else {
      // For confidential clients or hardcoded keys, use both ID and secret
      if (!clientSecret) {
        throw new Error('Twitch Client Secret not found. Public clients should enable the "Public Client" option.');
      }
      
      authParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      });
    }

    // Request a new token
    const response = await fetch(`${url}?${authParams.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitch auth error response:', errorText);
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data: TwitchAuthResponse = await response.json();

    // Store the token and calculate expiration time (subtract 5 minutes for safety)
    authToken = data.access_token;
    tokenExpiration = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

    return authToken;
  } catch (error) {
    console.error('Twitch authentication error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to authenticate with Twitch');
    throw error;
  }
};

/**
 * Get top live streams from Twitch
 */
export const getTopStreams = async (limit = 10): Promise<TwitchStream[]> => {
  try {
    const token = await getTwitchAuthToken();
    
    // Get client ID based on whether we're using hardcoded keys
    const useHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
    const clientId = useHardcodedKeys ? HARDCODED_CLIENT_ID : localStorage.getItem('twitch_client_id');

    if (!clientId) {
      throw new Error('Twitch client ID not found');
    }

    const response = await fetch(`${TWITCH_API_BASE}/streams?first=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch streams: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as TwitchStream[];
  } catch (error) {
    console.error('Error fetching Twitch streams:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to fetch Twitch streams');
    throw error;
  }
};

/**
 * Get clips for a specific broadcaster
 */
export const getClipsForBroadcaster = async (broadcasterId: string, limit = 5): Promise<TwitchClip[]> => {
  try {
    const token = await getTwitchAuthToken();
    
    // Get client ID based on whether we're using hardcoded keys
    const useHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
    const clientId = useHardcodedKeys ? HARDCODED_CLIENT_ID : localStorage.getItem('twitch_client_id');

    if (!clientId) {
      throw new Error('Twitch client ID not found');
    }

    // Get clips from the last 24 hours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const response = await fetch(
      `${TWITCH_API_BASE}/clips?broadcaster_id=${broadcasterId}&first=${limit}&started_at=${startDate.toISOString()}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': clientId,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch clips: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as TwitchClip[];
  } catch (error) {
    console.error('Error fetching Twitch clips:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to fetch Twitch clips');
    throw error;
  }
};

/**
 * Detect potential viral clips
 * This function analyzes streams and clips to find potential viral moments
 */
export const detectViralMoments = async (): Promise<{
  id: string;
  streamerName: string;
  viewerCount: number;
  chatActivity: number;
  clipUrl: string;
  thumbnailUrl: string;
  timestamp: string;
}[]> => {
  try {
    // 1. First get top streams
    const topStreams = await getTopStreams(20);
    
    // 2. For each stream, get recent clips
    const allClipsPromises = topStreams.map(stream => 
      getClipsForBroadcaster(stream.user_id)
        .then(clips => {
          // Attach stream data to each clip
          return clips.map(clip => ({
            clip,
            stream
          }));
        })
        .catch(() => []) // If fetching clips fails for a stream, return empty array
    );
    
    const allClipsResults = await Promise.all(allClipsPromises);
    const allClips = allClipsResults.flat();
    
    // 3. Score and filter clips based on "virality" algorithm
    // In a real app this would be more sophisticated
    return allClips
      .filter(item => item.clip.view_count > 50) // Basic filter for demo
      .sort((a, b) => b.clip.view_count - a.clip.view_count) // Sort by view count
      .slice(0, 10) // Take top 10
      .map(item => ({
        id: item.clip.id,
        streamerName: item.clip.broadcaster_name,
        viewerCount: item.stream.viewer_count,
        chatActivity: Math.floor(Math.random() * 150) + 30, // Simulated chat activity
        clipUrl: item.clip.url,
        thumbnailUrl: item.clip.thumbnail_url,
        timestamp: item.clip.created_at
      }));
  } catch (error) {
    console.error('Error detecting viral moments:', error);
    toast.error('Failed to detect viral moments');
    return [];
  }
};
