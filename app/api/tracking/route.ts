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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const order = searchParams.get('order') || 'DESC';
    const agentFilter = searchParams.get('agent'); // Added to support filtering by agent
    
    let combinedResults: any[] = [];

    // Query each table and add agent info to the results
    for (const { table, agent } of tableAgentMap) {
      try {
        // Skip if agent filter is specified and doesn't match
        if (agentFilter && agentFilter !== agent && agentFilter !== "all") {
          continue;
        }

        const query = `
          SELECT * FROM "${table}"
          ORDER BY ${sortBy === 'id' ? 'id' : 'timestamp'} ${order}
        `;
        
        const result = await pool.query(query);
        
        // Add agent info to each record
        const enhancedRows = result.rows.map((row: any) => ({
          ...row,
          agent: agent
        }));
        
        combinedResults = [...combinedResults, ...enhancedRows];
      } catch (error) {
        console.error(`Error querying table ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }
    
    // Sort combined results if needed
    if (sortBy === 'timestamp') {
      combinedResults.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return order === 'ASC' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'id') {
      combinedResults.sort((a, b) => {
        return order === 'ASC' ? a.id - b.id : b.id - a.id;
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: combinedResults,
      agents: tableAgentMap.map(item => item.agent) // Send available agent options
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
