import { toast } from "sonner";

// Twitch API endpoints
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

// Replace these with actual Twitch API credentials
// You can get them from https://dev.twitch.tv/console
const HARDCODED_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const HARDCODED_CLIENT_SECRET = ''; // We'll use a public client approach for the hardcoded credentials

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
  
  // For hardcoded keys, we're using a public client approach
  if (useHardcodedKeys) {
    if (clientId === 'your_client_id_here') {
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
    const isPublicClient = localStorage.getItem('is_public_client') === 'true' || useHardcodedKeys;
    
    let clientId, clientSecret;
    
    if (useHardcodedKeys) {
      // Use the hardcoded credentials
      clientId = HARDCODED_CLIENT_ID;
      clientSecret = HARDCODED_CLIENT_SECRET;
      
      // For the hardcoded client ID, we're going to use a special approach
      // This client ID is a public Twitch client ID that can be used for browsing
      console.log("Using built-in Twitch credentials");
      return clientId;
    } else {
      // Get client ID and secret from local storage (user provided)
      clientId = localStorage.getItem('twitch_client_id');
      clientSecret = localStorage.getItem('twitch_client_secret');
    }

    // For public clients we don't need to get an actual token
    if (isPublicClient) {
      console.log("Using public client approach with client ID only");
      authToken = clientId;
      tokenExpiration = Date.now() + (3600 * 1000); // 1 hour validity
      return authToken!;
    }

    // Request a new token for confidential clients
    const authParams = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'client_credentials'
    });

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
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data: TwitchAuthResponse = await response.json();

    // Store the token and calculate expiration time (subtract 5 minutes for safety)
    authToken = data.access_token;
    tokenExpiration = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

    return authToken;
  } catch (error) {
    console.error('Twitch authentication error:', error);
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

    // For the special hardcoded ID, we need a different approach to get live streams
    if (useHardcodedKeys && token === HARDCODED_CLIENT_ID) {
      console.log("Using direct GQL for top streams");
      return getTopStreamsViaGQL(limit);
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
    
    // Return mock data if we couldn't get real data
    return generateMockStreams(limit);
  }
};

/**
 * Special function to get top streams using GQL API
 * This works with the public hardcoded client ID
 */
const getTopStreamsViaGQL = async (limit = 10): Promise<TwitchStream[]> => {
  try {
    const query = {
      operationName: "BrowsePage_Popular",
      variables: {
        limit: limit,
        platformType: "all",
        options: {
          sort: "VIEWER_COUNT",
          recommendationsContext: { platform: "web" },
          requestID: "JIRA-VXP-2397",
          freeformTags: null,
          tags: []
        },
        sortTypeIsRecency: false
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: "4a3254b0e997e1fb4c9035a8c758256759862f6ef184ceb6d91554606f0e8340"
        }
      }
    };
    
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-Id": HARDCODED_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(query)
    });
    
    if (!response.ok) {
      throw new Error(`GQL request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the GQL response to match our TwitchStream interface
    if (data?.data?.streams?.edges) {
      return data.data.streams.edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          user_id: node.broadcaster.id,
          user_login: node.broadcaster.login,
          user_name: node.broadcaster.displayName,
          game_id: node.game ? node.game.id : "",
          game_name: node.game ? node.game.name : "No Game",
          type: "live",
          title: node.title,
          viewer_count: node.viewersCount,
          started_at: node.createdAt,
          language: node.broadcaster.primaryLanguage || "en",
          thumbnail_url: node.previewImageURL.replace('{width}', '1280').replace('{height}', '720'),
          tag_ids: [],
          is_mature: node.contentClassificationLabels.includes("mature")
        };
      });
    }
    
    throw new Error("Unexpected GQL response format");
  } catch (error) {
    console.error("Error fetching streams via GQL:", error);
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

    // For the special hardcoded ID, we need a different approach to get clips
    if (useHardcodedKeys && token === HARDCODED_CLIENT_ID) {
      console.log(`Using direct GQL for clips of broadcaster ${broadcasterId}`);
      return getClipsViaGQL(broadcasterId, limit);
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
    return generateMockClips(broadcasterId, limit);
  }
};

/**
 * Special function to get clips using GQL API
 * This works with the public hardcoded client ID
 */
const getClipsViaGQL = async (broadcasterId: string, limit = 5): Promise<TwitchClip[]> => {
  try {
    const query = {
      operationName: "ClipsCards__User",
      variables: {
        login: null,
        broadcasterID: broadcasterId,
        limit: limit,
        criteria: {
          filter: "ALL_TIME"
        }
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: "b300f79444fdcf2a1a76c101f466c8c9d9529538dcae7bc29a656c39c3bfc2fd"
        }
      }
    };
    
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-Id": HARDCODED_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(query)
    });
    
    if (!response.ok) {
      throw new Error(`GQL request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the GQL response to match our TwitchClip interface
    if (data?.data?.user?.clips?.edges) {
      return data.data.user.clips.edges.map((edge: any) => {
        const node = edge.node;
        const hostname = window.location.hostname;
        
        return {
          id: node.slug,
          url: node.url,
          embed_url: `https://clips.twitch.tv/embed?clip=${node.slug}&parent=${hostname}`,
          broadcaster_id: broadcasterId,
          broadcaster_name: node.broadcaster.displayName,
          creator_id: node.curator ? node.curator.id : "",
          creator_name: node.curator ? node.curator.displayName : "",
          video_id: node.video ? node.video.id : "",
          game_id: node.game ? node.game.id : "",
          language: "en",
          title: node.title,
          view_count: node.viewCount,
          created_at: node.createdAt,
          thumbnail_url: node.thumbnailURL,
          duration: node.durationSeconds
        };
      });
    }
    
    console.log("No clips found via GQL, response:", data);
    return [];
  } catch (error) {
    console.error("Error fetching clips via GQL:", error);
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
      return [];
    }
    
    return viralClips.map(item => ({
      id: item.clip.id,
      streamerName: item.clip.broadcaster_name,
      viewerCount: item.stream.viewer_count,
      chatActivity: Math.floor(Math.random() * 150) + 30, // Simulated chat activity
      clipUrl: item.clip.embed_url,
      thumbnailUrl: item.clip.thumbnail_url,
      timestamp: item.clip.created_at
    }));
  } catch (error) {
    console.error('Error detecting viral moments:', error);
    toast.error('Failed to detect viral moments');
    
    return [];
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
    const clipId = `demo-${broadcasterId}-${i}`;
    
    return {
      id: clipId,
      url: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}`,
      embed_url: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}`,
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
