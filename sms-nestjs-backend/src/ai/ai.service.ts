import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async getTeacherAnalyticsInsights(portalState: any): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not found in environment');
      return 'AI insights are currently unavailable because the OpenRouter API key is missing. Please configure it in your environment settings.';
    }

    try {
      const promptData = {
        totalClasses: portalState.classes.length,
        totalStudents: portalState.classes.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0),
        attendanceSummary: portalState.attendance.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {}),
        gradesEntered: portalState.grades.length,
      };

      const prompt = `You are an AI assistant for a school teacher. Analyze the following summary of their dashboard data:
${JSON.stringify(promptData, null, 2)}

Provide exactly 3 concise bullet points with an encouraging tone:
1. An insight about their class workload.
2. An insight about attendance trends.
3. A positive, actionable recommendation for grading or engagement.

Do not include any greeting or conversational filler. Output only the 3 bullet points using markdown bullet lists (- ).`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? 'No response from AI service.';
    } catch (error) {
      this.logger.error('Error fetching AI insights:', error);
      return 'Unable to generate AI insights at this time. Please check your network connection or try again later.';
    }
  }

  async getStudentAcademicInsights(profileData: any): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return "AI insights require an OpenRouter API key. Please configure the backend.";
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SFXSAI Dashboard',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert academic advisor. Analyze the student\'s academic profile (grades, attendance, core values, health, and history). Provide a brief, encouraging, and highly analytical 3-sentence summary highlighting their strengths, areas for improvement, and an actionable tip for the teacher. Do NOT use markdown. Keep it concise.'
            },
            {
              role: 'user',
              content: JSON.stringify(profileData)
            }
          ]
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? 'No response from AI service.';
    } catch (error) {
      console.error('Failed to generate student academic insights:', error);
      return "Unable to generate insights at this time. Please try again later.";
    }
  }
}
