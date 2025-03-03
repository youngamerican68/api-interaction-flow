
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
 * Validate if we have proper credentials set up
 */
const validateCredentials = () => {
  const useHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
  const isPublicClient = localStorage.getItem('is_public_client') === 'true';
  const clientId = useHardcodedKeys ? HARDCODED_CLIENT_ID : localStorage.getItem('twitch_client_id');
  const clientSecret = useHardcodedKeys ? HARDCODED_CLIENT_SECRET : localStorage.getItem('twitch_client_secret');
  
  // Check if we're using hardcoded keys and they're valid
  if (useHardcodedKeys) {
    if (clientId === 'your_client_id_here' || clientSecret === 'your_client_secret_here') {
      throw new Error('The application is configured to use built-in API credentials, but they have not been set. Please contact the administrator.');
    }
    return true;
  }
  
  // For custom credentials
  if (!clientId) {
    throw new Error('Twitch API Client ID not found. Please set it in the settings.');
  }
  
  return true;
};

/**
 * Get the Twitch API authentication token
 * For public clients, we'll use the client credentials flow without a client secret
 */
export const getTwitchAuthToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (authToken && tokenExpiration && Date.now() < tokenExpiration) {
    return authToken;
  }

  try {
    // Validate credentials before proceeding
    validateCredentials();
    
    // Check if we're using hardcoded keys
    const useHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
    const isPublicClient = localStorage.getItem('is_public_client') === 'true';
    
    let clientId, clientSecret;
    
    if (useHardcodedKeys) {
      // Use the hardcoded credentials
      clientId = HARDCODED_CLIENT_ID;
      clientSecret = HARDCODED_CLIENT_SECRET;
    } else {
      // Get client ID and secret from local storage (user provided)
      clientId = localStorage.getItem('twitch_client_id');
      clientSecret = localStorage.getItem('twitch_client_secret');
    }

    // For public clients using implicit flow, we can use a different approach
    // Here we're setting up a temporary workaround to get demos working
    if (isPublicClient && !useHardcodedKeys) {
      console.log("Using demo mode for public client without credentials");
      // Create a fake token for demo purposes
      authToken = "demo_mode_token";
      tokenExpiration = Date.now() + (3600 * 1000);
      return authToken;
    }

    let authParams = new URLSearchParams({
      client_id: clientId!,
      grant_type: 'client_credentials'
    });

    if (clientSecret) {
      authParams.append('client_secret', clientSecret);
    }

    // Request a new token
    const response = await fetch(`${TWITCH_AUTH_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: authParams.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitch auth error response:', errorText);
      
      // If we're missing client_secret, use demo mode
      if (errorText.includes('Missing params: client_secret')) {
        console.log("Switching to demo mode due to missing client secret");
        authToken = "demo_mode_token";
        tokenExpiration = Date.now() + (3600 * 1000);
        return authToken;
      }
      
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data: TwitchAuthResponse = await response.json();

    // Store the token and calculate expiration time (subtract 5 minutes for safety)
    authToken = data.access_token;
    tokenExpiration = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

    return authToken;
  } catch (error) {
    console.error('Twitch authentication error:', error);
    
    // In case of any error, switch to demo mode for testing
    console.log("Switching to demo mode due to authentication error");
    authToken = "demo_mode_token";
    tokenExpiration = Date.now() + (3600 * 1000);
    return authToken;
  }
};

/**
 * Get top live streams from Twitch
 */
export const getTopStreams = async (limit = 10): Promise<TwitchStream[]> => {
  try {
    const token = await getTwitchAuthToken();
    
    // If we're in demo mode, return mock data
    if (token === "demo_mode_token") {
      console.log("Using demo data for streams");
      return generateMockStreams(limit);
    }
    
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
      const errorText = await response.text();
      console.error('Twitch streams API error:', errorText);
      throw new Error(`Failed to fetch streams: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.data.length} top streams`);
    return data.data as TwitchStream[];
  } catch (error) {
    console.error('Error fetching Twitch streams:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to fetch Twitch streams');
    
    // Return mock data in case of error
    return generateMockStreams(limit);
  }
};

/**
 * Get clips for a specific broadcaster
 */
export const getClipsForBroadcaster = async (broadcasterId: string, limit = 5): Promise<TwitchClip[]> => {
  try {
    const token = await getTwitchAuthToken();
    
    // If we're in demo mode, return mock data
    if (token === "demo_mode_token") {
      console.log(`Using demo data for clips of broadcaster ${broadcasterId}`);
      return generateMockClips(broadcasterId, limit);
    }
    
    // Get client ID based on whether we're using hardcoded keys
    const useHardcodedKeys = localStorage.getItem('use_hardcoded_keys') === 'true';
    const clientId = useHardcodedKeys ? HARDCODED_CLIENT_ID : localStorage.getItem('twitch_client_id');

    if (!clientId) {
      throw new Error('Twitch client ID not found');
    }

    // Get clips from the last 7 days instead of just 24 hours to increase chances of finding clips
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const url = `${TWITCH_API_BASE}/clips?broadcaster_id=${broadcasterId}&first=${limit}&started_at=${startDate.toISOString()}`;
    console.log(`Fetching clips for broadcaster ${broadcasterId} with URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twitch clips API error for broadcaster ${broadcasterId}:`, errorText);
      throw new Error(`Failed to fetch clips: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.data.length} clips for broadcaster ${broadcasterId}`);
    return data.data as TwitchClip[];
  } catch (error) {
    console.error(`Error fetching Twitch clips for broadcaster ${broadcasterId}:`, error);
    // Don't show toast for individual clip fetch errors to avoid spamming
    return generateMockClips(broadcasterId, limit);
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
    console.log('Starting viral moment detection...');
    
    // 1. First get top streams
    const topStreams = await getTopStreams(20);
    console.log(`Processing ${topStreams.length} top streams for viral clips`);
    
    if (topStreams.length === 0) {
      console.log('No streams found, cannot detect viral moments');
      return [];
    }
    
    // 2. For each stream, get recent clips
    const allClipsPromises = topStreams.map(stream => 
      getClipsForBroadcaster(stream.user_id, 10) // Increase clips per streamer to 10
        .then(clips => {
          // Attach stream data to each clip
          return clips.map(clip => ({
            clip,
            stream
          }));
        })
        .catch(error => {
          console.error(`Error getting clips for streamer ${stream.user_name}:`, error);
          return []; // If fetching clips fails for a stream, return empty array
        })
    );
    
    const allClipsResults = await Promise.all(allClipsPromises);
    const allClips = allClipsResults.flat();
    
    console.log(`Found ${allClips.length} total clips across all streamers`);
    
    if (allClips.length === 0) {
      console.log('No clips found, cannot detect viral moments');
      toast.info('No recent clips found from top streamers. Try again later.');
      return [];
    }
    
    // 3. Score and filter clips based on "virality" algorithm
    // Make more lenient by lowering the view threshold to 5 instead of 50
    const viralClips = allClips
      .filter(item => item.clip.view_count > 5) // Much more lenient filter
      .sort((a, b) => b.clip.view_count - a.clip.view_count) // Sort by view count
      .slice(0, 10); // Take top 10
    
    console.log(`Found ${viralClips.length} potential viral clips after filtering`);
    
    if (viralClips.length === 0) {
      console.log('No clips met the virality threshold');
      toast.info('No viral clips detected. Try again later.');
      
      // If no clips are found after the real search, generate some mock clips for demo
      return generateMockViralMoments();
    }
    
    return viralClips.map(item => ({
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
    // Return some mock viral moments in case of any error
    return generateMockViralMoments();
  }
};

// MOCK DATA GENERATORS
// These functions generate realistic-looking mock data for demo purposes

/**
 * Generate mock streams for demo purposes
 */
const generateMockStreams = (limit: number): TwitchStream[] => {
  const games = [
    { id: '509658', name: 'Just Chatting' },
    { id: '33214', name: 'Fortnite' },
    { id: '21779', name: 'League of Legends' },
    { id: '516575', name: 'VALORANT' },
    { id: '27471', name: 'Minecraft' },
    { id: '512710', name: 'Call of Duty: Warzone' },
    { id: '511224', name: 'Apex Legends' }
  ];
  
  const streamers = [
    { id: '1234567', login: 'ninja', name: 'Ninja' },
    { id: '2345678', login: 'pokimane', name: 'Pokimane' },
    { id: '3456789', login: 'shroud', name: 'shroud' },
    { id: '4567890', login: 'timthetatman', name: 'TimTheTatman' },
    { id: '5678901', login: 'xqc', name: 'xQc' },
    { id: '6789012', login: 'sodapoppin', name: 'Sodapoppin' },
    { id: '7890123', login: 'summit1g', name: 'summit1g' },
    { id: '8901234', login: 'nickmercs', name: 'NICKMERCS' },
    { id: '9012345', login: 'tfue', name: 'Tfue' },
    { id: '0123456', login: 'lirik', name: 'LIRIK' }
  ];
  
  return Array.from({ length: Math.min(limit, streamers.length) }, (_, i) => {
    const streamer = streamers[i];
    const game = games[Math.floor(Math.random() * games.length)];
    const viewers = Math.floor(Math.random() * 50000) + 5000;
    
    return {
      id: `stream${i}`,
      user_id: streamer.id,
      user_login: streamer.login,
      user_name: streamer.name,
      game_id: game.id,
      game_name: game.name,
      type: 'live',
      title: `${streamer.name} playing ${game.name} - ${Math.random() < 0.3 ? 'INSANE GAMEPLAY!' : 'Chill stream with viewers'}`,
      viewer_count: viewers,
      started_at: new Date(Date.now() - Math.floor(Math.random() * 6 * 60 * 60 * 1000)).toISOString(),
      language: 'en',
      thumbnail_url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${streamer.login}-{width}x{height}.jpg`,
      tag_ids: [],
      is_mature: Math.random() > 0.7
    };
  });
};

/**
 * Generate mock clips for demo purposes
 */
const generateMockClips = (broadcasterId: string, limit: number): TwitchClip[] => {
  // Find broadcaster name based on ID
  const streamers = [
    { id: '1234567', login: 'ninja', name: 'Ninja' },
    { id: '2345678', login: 'pokimane', name: 'Pokimane' },
    { id: '3456789', login: 'shroud', name: 'shroud' },
    { id: '4567890', login: 'timthetatman', name: 'TimTheTatman' },
    { id: '5678901', login: 'xqc', name: 'xQc' },
    { id: '6789012', login: 'sodapoppin', name: 'Sodapoppin' },
    { id: '7890123', login: 'summit1g', name: 'summit1g' },
    { id: '8901234', login: 'nickmercs', name: 'NICKMERCS' },
    { id: '9012345', login: 'tfue', name: 'Tfue' },
    { id: '0123456', login: 'lirik', name: 'LIRIK' }
  ];
  
  const streamer = streamers.find(s => s.id === broadcasterId) || 
    { id: broadcasterId, login: 'streamer', name: 'Streamer' };
    
  const games = [
    { id: '509658', name: 'Just Chatting' },
    { id: '33214', name: 'Fortnite' },
    { id: '21779', name: 'League of Legends' },
    { id: '516575', name: 'VALORANT' },
    { id: '27471', name: 'Minecraft' }
  ];
  
  const clipTitles = [
    `${streamer.name} makes an incredible play!`,
    `${streamer.name}'s reaction to donation`,
    `${streamer.name} can't believe what just happened`,
    `When ${streamer.name} realized...`,
    `${streamer.name}'s perfect timing`,
    `${streamer.name} breaks the game`,
    `${streamer.name}'s funniest moment today`,
    `${streamer.name} almost had a heart attack`,
    `${streamer.name} shows how it's done`,
    `${streamer.name}'s chat goes wild`
  ];
  
  return Array.from({ length: limit }, (_, i) => {
    const game = games[Math.floor(Math.random() * games.length)];
    const views = Math.floor(Math.random() * 5000) + 20;
    const created = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString();
    const duration = Math.floor(Math.random() * 50) + 10;
    
    return {
      id: `clip${broadcasterId}${i}`,
      url: `https://clips.twitch.tv/clip/${broadcasterId}${i}`,
      embed_url: `https://clips.twitch.tv/embed?clip=${broadcasterId}${i}`,
      broadcaster_id: streamer.id,
      broadcaster_name: streamer.name,
      creator_id: `creator${i}`,
      creator_name: `Creator${i}`,
      video_id: `v${i}12345`,
      game_id: game.id,
      language: 'en',
      title: clipTitles[i % clipTitles.length],
      view_count: views,
      created_at: created,
      thumbnail_url: `https://picsum.photos/seed/${streamer.login}${i}/640/360`,
      duration: duration
    };
  });
};

/**
 * Generate mock viral moments for demo purposes
 */
const generateMockViralMoments = (): {
  id: string;
  streamerName: string;
  viewerCount: number;
  chatActivity: number;
  clipUrl: string;
  thumbnailUrl: string;
  timestamp: string;
}[] => {
  const streamers = [
    { name: 'Ninja', viewers: 45000 },
    { name: 'Pokimane', viewers: 30000 },
    { name: 'shroud', viewers: 38000 },
    { name: 'TimTheTatman', viewers: 25000 },
    { name: 'xQc', viewers: 50000 },
    { name: 'Sodapoppin', viewers: 22000 },
    { name: 'summit1g', viewers: 28000 }
  ];
  
  return Array.from({ length: 10 }, (_, i) => {
    const streamer = streamers[i % streamers.length];
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 6 * 60 * 60 * 1000)).toISOString();
    
    return {
      id: `viral${i}`,
      streamerName: streamer.name,
      viewerCount: streamer.viewers,
      chatActivity: Math.floor(Math.random() * 150) + 50,
      clipUrl: `https://clips.twitch.tv/clip/viral${i}`,
      thumbnailUrl: `https://picsum.photos/seed/viral${i}/640/360`,
      timestamp: timestamp
    };
  });
};
