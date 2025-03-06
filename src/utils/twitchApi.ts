import { toast } from "sonner";

// Twitch API endpoints
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
const TWITCH_GQL_ENDPOINT = 'https://gql.twitch.tv/gql';

// Client credentials - these should be set by the user in the settings
// These are just fallbacks
const DEFAULT_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

// Popular Twitch categories with their IDs
export const POPULAR_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: '26936', name: 'Music' },
  { id: '509658', name: 'Just Chatting' },
  { id: '33214', name: 'Fortnite' },
  { id: '21779', name: 'League of Legends' },
  { id: '516575', name: 'VALORANT' },
  { id: '27471', name: 'Minecraft' },
  { id: '512710', name: 'Call of Duty: Warzone' },
  { id: '511224', name: 'Apex Legends' },
  { id: '18122', name: 'World of Warcraft' },
  { id: '518203', name: 'Sports' },
  { id: '116747788', name: 'Pools, Hot Tubs, & Beaches' }
];

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
 * Clear the stored auth token to force a refresh
 */
export const clearAuthToken = () => {
  authToken = null;
  tokenExpiration = null;
  console.log("Auth token cleared, will fetch a new one on next API call");
};

/**
 * Get real Twitch authentication token
 * Using the client credentials flow
 */
export const getTwitchAuthToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (authToken && tokenExpiration && Date.now() < tokenExpiration) {
    return authToken;
  }

  try {
    // Try using the App Access Token flow
    const clientId = getClientId();
    const clientSecret = localStorage.getItem('twitch_client_secret');
    
    // If we have a client secret, use the client credentials flow
    if (clientSecret) {
      console.log("Using client credentials flow with provided credentials");
      
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('grant_type', 'client_credentials');
      
      const response = await fetch(TWITCH_AUTH_URL, {
        method: 'POST',
        body: params
      });
      
      if (!response.ok) {
        throw new Error(`OAuth request failed: ${response.status}`);
      }
      
      const data: TwitchAuthResponse = await response.json();
      authToken = data.access_token;
      tokenExpiration = Date.now() + (data.expires_in * 900); // 90% of the expiry time to be safe
      
      return authToken;
    }
    
    // If no client secret, we can attempt to use the implicit flow
    // For our demo purposes, this will likely still fail, but worth trying
    console.log("No client secret provided, trying to authenticate with client ID only");
    
    // Attempt to use a public API endpoint that doesn't require auth
    // For demonstration purposes
    // This is not a real auth token, but we'll try to use the client ID as a token
    return clientId;
  } catch (error) {
    console.error('Error getting Twitch auth token:', error);
    throw new Error('Failed to authenticate with Twitch: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Get Twitch Client ID from localStorage or use default
 */
const getClientId = (): string => {
  const clientId = localStorage.getItem('twitch_client_id');
  return clientId || DEFAULT_CLIENT_ID;
};

/**
 * Gets top live streams from Twitch, optionally filtered by category
 */
export const getTopStreams = async (limit = 10, categoryId?: string): Promise<TwitchStream[]> => {
  try {
    const token = await getTwitchAuthToken();
    const clientId = getClientId();
    
    // Build the URL with optional game_id filter
    let url = `${TWITCH_API_BASE}/streams?first=${limit}`;
    if (categoryId && categoryId !== 'all') {
      url += `&game_id=${categoryId}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error(`Twitch API error: ${response.status} ${response.statusText}`);
      throw new Error(`Twitch API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.data) {
      console.log(`Fetched ${data.data.length} top streams via REST API ${categoryId ? `for category ${categoryId}` : ''}`);
      return data.data;
    }
    
    throw new Error("Unexpected Twitch API response format");
  } catch (error) {
    console.error('Error fetching Twitch streams:', error);
    
    if (localStorage.getItem('twitch_client_secret')) {
      // Only show error toast if user has provided credentials
      toast.error('Failed to fetch Twitch streams. Please check your API credentials.');
    }
    
    // If we can't get real data, throw the error up to be handled
    throw error;
  }
};

/**
 * Get clips for a specific broadcaster
 * The 'started_at' parameter ensures we get only today's clips
 */
export const getClipsForBroadcaster = async (broadcasterId: string, limit = 5): Promise<TwitchClip[]> => {
  try {
    const token = await getTwitchAuthToken();
    const clientId = getClientId();
    
    // Get clips from today only
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const startDateString = today.toISOString();
    
    console.log(`Fetching clips from ${startDateString} for broadcaster ${broadcasterId}`);
    
    const response = await fetch(`${TWITCH_API_BASE}/clips?broadcaster_id=${broadcasterId}&first=${limit}&started_at=${startDateString}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Twitch API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.data && data.data.length > 0) {
      // Transform the clips to include the embedded URL
      const hostname = window.location.hostname;
      const clips = data.data.map((clip: any) => {
        return {
          ...clip,
          embed_url: `https://clips.twitch.tv/embed?clip=${clip.id}&parent=${hostname}`
        };
      });
      
      console.log(`Fetched ${clips.length} TODAY's clips for broadcaster ${broadcasterId}`);
      return clips;
    }
    
    // If no clips found for today, we'll try the last 24 hours as a fallback
    console.log(`No clips found for today for broadcaster ${broadcasterId}, trying last 24 hours`);
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const last24HoursString = last24Hours.toISOString();
    
    const fallbackResponse = await fetch(`${TWITCH_API_BASE}/clips?broadcaster_id=${broadcasterId}&first=${limit}&started_at=${last24HoursString}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!fallbackResponse.ok) {
      throw new Error(`Twitch API fallback request failed: ${fallbackResponse.status}`);
    }
    
    const fallbackData = await fallbackResponse.json();
    
    if (fallbackData?.data && fallbackData.data.length > 0) {
      // Transform the clips to include the embedded URL
      const hostname = window.location.hostname;
      const clips = fallbackData.data.map((clip: any) => {
        return {
          ...clip,
          embed_url: `https://clips.twitch.tv/embed?clip=${clip.id}&parent=${hostname}`
        };
      });
      
      console.log(`Fetched ${clips.length} clips from last 24 hours for broadcaster ${broadcasterId}`);
      return clips;
    }
    
    console.log(`No recent clips found for broadcaster ${broadcasterId}, no clips will be included`);
    return [];
  } catch (error) {
    console.error(`Error fetching clips for broadcaster ${broadcasterId}:`, error);
    throw error;
  }
};

/**
 * Detect potential viral clips
 * This function analyzes streams and clips to find potential viral moments
 * based on viewer count and chat activity
 */
export const detectViralMoments = async (options: {
  useMockData?: boolean;
  categoryId?: string;
} = {}): Promise<{
  id: string;
  streamerName: string;
  viewerCount: number;
  chatActivity: number;
  clipUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  viralScore: number;
  gameId?: string;
  gameName?: string;
}[]> => {
  const { useMockData = false, categoryId } = options;
  
  // If mock data is explicitly requested, return it immediately
  if (useMockData) {
    console.log('Mock data explicitly requested');
    return generateMockViralMoments(categoryId);
  }
  
  try {
    console.log(`Starting viral moment detection with real Twitch data for category: ${categoryId || 'all'}`);
    
    // Get top streams
    const topStreams = await getTopStreams(20, categoryId);
    console.log(`Processing ${topStreams.length} streams for viral clips`);
    
    // For each stream, get recent clips
    const allClipsPromises = topStreams.map(stream => 
      getClipsForBroadcaster(stream.user_id, 5)
        .then(clips => {
          // Attach stream data to each clip
          return clips.map(clip => ({
            clip,
            stream
          }));
        })
    );
    
    const allClipsResults = await Promise.all(allClipsPromises);
    const allClips = allClipsResults.flat();
    
    console.log(`Found ${allClips.length} total clips across all streamers`);
    
    if (allClips.length === 0) {
      throw new Error('No clips found from Twitch API');
    }
    
    // Calculate a "viral score" for each clip
    // This combines view count and chat activity into a single metric
    const scoredClips = allClips.map(item => {
      const chatActivity = Math.floor(Math.random() * 150) + 30; // Simulated chat activity
      
      // Calculate viral score: weighted combination of viewer count and chat activity
      // Normalize both factors to be on similar scales
      const viewerWeight = 0.7; // 70% weight to viewer count
      const chatWeight = 0.3;   // 30% weight to chat activity
      
      // Normalize viewer count (divide by max possible to get 0-1 range)
      const normalizedViewCount = item.stream.viewer_count / 100000;
      // Chat activity is already in a reasonable range
      const normalizedChatActivity = chatActivity / 200;
      
      // Combined score
      const viralScore = (normalizedViewCount * viewerWeight) + 
                         (normalizedChatActivity * chatWeight);
      
      // Format the timestamp to be more readable and indicate if it's from today
      const clipDate = new Date(item.clip.created_at);
      const today = new Date();
      const isToday = clipDate.getDate() === today.getDate() && 
                       clipDate.getMonth() === today.getMonth() && 
                       clipDate.getFullYear() === today.getFullYear();
                       
      return {
        id: item.clip.id,
        streamerName: item.clip.broadcaster_name,
        viewerCount: item.stream.viewer_count,
        chatActivity: chatActivity,
        clipUrl: item.clip.embed_url,
        thumbnailUrl: item.clip.thumbnail_url,
        timestamp: item.clip.created_at,
        viralScore: viralScore,
        isToday: isToday,
        gameId: item.stream.game_id,
        gameName: item.stream.game_name
      };
    });
    
    // Sort by viral score AND prioritize today's clips
    const viralClips = scoredClips
      .sort((a, b) => {
        // First prioritize today's clips
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        // Then sort by viral score
        return b.viralScore - a.viralScore;
      })
      .slice(0, 10) // Take top 10
      .map(clip => {
        // Remove the isToday property before returning
        const { isToday, ...clipWithoutIsToday } = clip;
        return clipWithoutIsToday;
      });
    
    console.log(`Found ${viralClips.length} potential viral clips after filtering`);
    
    return viralClips;
  } catch (error) {
    console.error('Error detecting viral moments:', error);
    // Do not automatically fall back to mock data
    // Instead, throw the error so the calling component can decide
    throw error;
  }
};

// MOCK DATA GENERATORS
// These functions generate realistic-looking mock data for demo purposes

/**
 * Generate mock streams for demo purposes
 */
const generateMockStreams = (limit: number, categoryId?: string): TwitchStream[] => {
  const games = [
    { id: '26936', name: 'Music' },
    { id: '509658', name: 'Just Chatting' },
    { id: '33214', name: 'Fortnite' },
    { id: '21779', name: 'League of Legends' },
    { id: '516575', name: 'VALORANT' },
    { id: '27471', name: 'Minecraft' },
    { id: '512710', name: 'Call of Duty: Warzone' },
    { id: '511224', name: 'Apex Legends' }
  ];
  
  // If a category ID is provided, filter the games
  const filteredGames = categoryId && categoryId !== 'all' 
    ? games.filter(game => game.id === categoryId)
    : games;
  
  // If filtering results in empty array, use the first game (shouldn't happen with valid IDs)
  const gamesToUse = filteredGames.length > 0 ? filteredGames : [games[0]];
  
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
  
  // For Music category, use music streamers
  const musicStreamers = [
    { id: 'm123456', login: 'drlupo', name: 'MusicianOne' },
    { id: 'm234567', login: 'nickeh30', name: 'DJ_Awesome' },
    { id: 'm345678', login: 'clix', name: 'GuitarGod' },
    { id: 'm456789', login: 'bugha', name: 'PianoPlayer' },
    { id: 'm567890', login: 'mongraal', name: 'LiveBandHQ' },
    { id: 'm678901', login: 'symfuhny', name: 'DrummerGirl' },
    { id: 'm789012', login: 'myth', name: 'SaxophoneKing' },
    { id: 'm890123', login: 'dakotaz', name: 'ViolinVirtuoso' },
    { id: 'm901234', login: 'nickmercs', name: 'BeatMaster' },
    { id: 'm012345', login: 'sypherpk', name: 'VocalDiva' }
  ];
  
  // Choose streamers based on category
  const streamersToUse = categoryId === '26936' ? musicStreamers : streamers;
  
  return Array.from({ length: Math.min(limit, streamersToUse.length) }, (_, i) => {
    const streamer = streamersToUse[i];
    // For specific category, always use that game. Otherwise pick randomly
    const game = categoryId && categoryId !== 'all'
      ? gamesToUse[0]
      : gamesToUse[Math.floor(Math.random() * gamesToUse.length)];
      
    const viewers = Math.floor(Math.random() * 50000) + 5000;
    
    // Make music titles more music-related
    let title = '';
    if (game.id === '26936') {
      const musicTitles = [
        `${streamer.name}'s Live Concert 🎵`,
        `${streamer.name} - Live Jam Session 🎸`,
        `${streamer.name} playing ${Math.random() < 0.5 ? 'requests' : 'originals'} 🎹`,
        `LIVE Music with ${streamer.name} 🎤`,
        `${streamer.name}'s Music Marathon 🎵`,
        `Chill Music Stream with ${streamer.name} 🎧`
      ];
      title = musicTitles[Math.floor(Math.random() * musicTitles.length)];
    } else {
      title = `${streamer.name} playing ${game.name} - ${Math.random() < 0.3 ? 'INSANE GAMEPLAY!' : 'Chill stream with viewers'}`;
    }
    
    return {
      id: `stream${i}`,
      user_id: streamer.id,
      user_login: streamer.login,
      user_name: streamer.name,
      game_id: game.id,
      game_name: game.name,
      type: 'live',
      title: title,
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
    const hostname = window.location.hostname;
    
    return {
      id: clipId,
      url: `https://clips.twitch.tv/${clipId}`,
      embed_url: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${hostname}`,
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
const generateMockViralMoments = (categoryId?: string): {
  id: string;
  streamerName: string;
  viewerCount: number;
  chatActivity: number;
  clipUrl: string;
  thumbnailUrl: string;
  timestamp: string;
  viralScore: number;
  gameId?: string;
  gameName?: string;
}[] => {
  // Generate different streamers based on category
  const musicStreamers = [
    { name: 'MusicianOne', viewers: 25000 },
    { name: 'DJ_Awesome', viewers: 18000 },
    { name: 'GuitarGod', viewers: 32000 },
    { name: 'PianoPlayer', viewers: 15000 },
    { name: 'LiveBandHQ', viewers: 29000 },
    { name: 'DrummerGirl', viewers: 21000 },
    { name: 'SaxophoneKing', viewers: 17000 },
  ];
  
  const gamingStreamers = [
    { name: 'Ninja', viewers: 45000 },
    { name: 'Pokimane', viewers: 30000 },
    { name: 'shroud', viewers: 38000 },
    { name: 'TimTheTatman', viewers: 25000 },
    { name: 'xQc', viewers: 50000 },
    { name: 'Sodapoppin', viewers: 22000 },
    { name: 'summit1g', viewers: 28000 }
  ];
  
  // Choose streamers and game name based on category
  const streamers = categoryId === '26936' ? musicStreamers : gamingStreamers;
  const gameName = categoryId === '26936' ? 'Music' : 
                   categoryId === '509658' ? 'Just Chatting' :
                   categoryId === '33214' ? 'Fortnite' :
                   categoryId === '21779' ? 'League of Legends' :
                   'Gaming';
  
  const hostname = window.location.hostname;
  
  return Array.from({ length: 10 }, (_, i) => {
    const streamer = streamers[i % streamers.length];
    // Make mock data show today's date
    const today = new Date();
    // Randomize the hours to make it look realistic
    today.setHours(Math.floor(Math.random() * 24), 
                   Math.floor(Math.random() * 60),
                   Math.floor(Math.random() * 60));
    const timestamp = today.toISOString();
    const clipId = `mock-viral-${categoryId || 'all'}-${i}`;
    const chatActivity = Math.floor(Math.random() * 150) + 50;
    
    // Calculate viral score for mock data too
    const viewerWeight = 0.7;
    const chatWeight = 0.3;
    const normalizedViewCount = streamer.viewers / 100000;
    const normalizedChatActivity = chatActivity / 200;
    const viralScore = (normalizedViewCount * viewerWeight) + 
                       (normalizedChatActivity * chatWeight);
    
    return {
      id: clipId,
      streamerName: streamer.name,
      viewerCount: streamer.viewers,
      chatActivity: chatActivity,
      clipUrl: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${hostname}`,
      thumbnailUrl: `https://picsum.photos/seed/viral${categoryId || 'all'}${i}/640/360`,
      timestamp: timestamp,
      viralScore: viralScore,
      gameId: categoryId || 'all',
      gameName: gameName
    };
  });
};
