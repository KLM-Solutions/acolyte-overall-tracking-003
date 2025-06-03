import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:2TYvAzNlt0Oy@ep-noisy-shape-a5hfgfjr-pooler.us-east-2.aws.neon.tech/documents?sslmode=require'
});

// Define all table names with corresponding agent labels
const tableAgentMap = [
  { table: "Tracking-acolyte-biosimilars-and-specialty-drugs", agent: "101- Block 3 - Practice Session" },
  { table: "Tracking-acolyte-drug-statistics", agent: "101 - Block 5 - Practice Session" },
  { table: "Tracking-acolyte-drug-pricing-access", agent: "101 - Block 9 - Practice Session" },
  { table: "Tracking-acolyte-workplacesim", agent: "101 - Block 12 - Practice (Workplace Sim)" },
  { table: "Tracking-acolyte-103-drug-pricing-analogy", agent: "103- Block 3 - Practice Session" },
  { table: "Tracking-acolyte-103-pricing-models", agent: "103 - Block 5 - Practice Session" },
  { table: "Tracking-acolyte-103-formulary-and-plan-designn", agent: "103 - Block 7 - Practice Session" },
  { table: "Tracking-acolyte-103-practice", agent: "103 - Block 10 - Practice (Workplace Sim)" },
  { table: "Tracking-103 - Workplace Sim : Nondiscrimination Testing", agent: "103-workplace-sim-nondiscrimination-testing" },
];

export async function GET() {
  try {
    let combinedMetrics: any[] = [];

    // Query each table and process the data
    for (const { table, agent } of tableAgentMap) {
      try {
        const query = `
          SELECT 
            session_id,
            timestamp,
            conversation_data
          FROM "${table}"
          ORDER BY timestamp DESC
        `;
        
        const result = await pool.query(query);
        
        // Process each session
        const processedSessions = result.rows.map((row: any) => {
          const conversationData = row.conversation_data || [];
          const startTime = conversationData[0]?.timestamp || row.timestamp;
          const endTime = conversationData[conversationData.length - 1]?.timestamp || row.timestamp;
          
          return {
            session_id: row.session_id,
            date: new Date(row.timestamp).toLocaleDateString(),
            agent: agent,
            conversation_count: conversationData.length,
            start_time: new Date(startTime).toLocaleTimeString(),
            end_time: new Date(endTime).toLocaleTimeString(),
            coming_soon_1: "Coming Soon",
            coming_soon_2: "Coming Soon",
            conversation_data: conversationData
          };
        });
        
        combinedMetrics = [...combinedMetrics, ...processedSessions];
      } catch (error) {
        console.error(`Error querying table ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }
    
    // Sort by timestamp (most recent first)
    combinedMetrics.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.start_time);
      const dateB = new Date(b.date + ' ' + b.start_time);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ 
      success: true, 
      data: combinedMetrics
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 