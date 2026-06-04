import prisma from '@/lib/prisma';

export async function syncToNotion(dailyLog: any, trades: any[]) {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings || !settings.notionApiKey) return;

    const apiKey = settings.notionApiKey;
    
    // 1. Search for a database named "Maven Trading Journal"
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Maven Trading Journal',
        filter: { property: 'object', value: 'database' },
      }),
    });

    if (!searchRes.ok) {
      console.error('Notion search failed:', await searchRes.text());
      return;
    }

    const searchData = await searchRes.json();
    const database = searchData.results?.[0];
    if (!database) {
      console.error('No Notion database named "Maven Trading Journal" found in workspace search.');
      return;
    }

    const databaseId = database.id;
    const dateStr = new Date(dailyLog.date).toLocaleDateString();

    const totalPnl = trades.reduce((sum, t) => sum + (t.actualPnlPct ?? 0), 0);
    const resultTag = totalPnl >= 0 ? 'Profit' : 'Loss';
    
    // Extract unique assets traded
    const assets = Array.from(new Set(trades.map(t => t.asset)));

    // 2. Create Page in Database
    const pagePayload = {
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: { content: `Daily Log — ${dateStr}` }
            }
          ]
        },
        Phase: {
          select: { name: settings.currentPhase }
        },
        Result: {
          select: { name: resultTag }
        },
        Assets: {
          multi_select: assets.map(asset => ({ name: asset }))
        },
        PnL: {
          number: totalPnl
        }
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Daily Summary' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: dailyLog.autoSummary || 'No summary generated.' } }]
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Daily Reflection' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: `Market Bias: ${dailyLog.marketBias || 'Neutral'}\nKey Lesson: ${dailyLog.lessonLearned || 'N/A'}\nTomorrow's Plan: ${dailyLog.tomorrowPlan || 'N/A'}` } }]
          }
        }
      ]
    };

    const createRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pagePayload),
    });

    if (!createRes.ok) {
      console.error('Notion page creation failed:', await createRes.text());
    } else {
      console.log('Successfully synced daily log to Notion!');
    }
  } catch (err) {
    console.error('Notion integration error:', err);
  }
}
