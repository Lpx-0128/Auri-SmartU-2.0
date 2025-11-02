export interface Prediction {
  message: string;
  severity: 'high' | 'medium' | 'low';
  icon: 'traffic' | 'lift' | 'parking' | 'general';
  confidence: number;
}

export async function predictNextHour(): Promise<Prediction> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-next-hour`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Prediction API error: ${response.statusText}`);
    }

    const prediction = await response.json();

    return {
      message: prediction.message || 'Unable to generate prediction',
      severity: prediction.severity || 'low',
      icon: prediction.icon || 'general',
      confidence: prediction.confidence || 0.5
    };
  } catch (error) {
    console.error('Prediction error:', error);

    return {
      message: 'AI prediction temporarily unavailable',
      severity: 'low',
      icon: 'general',
      confidence: 0
    };
  }
}
