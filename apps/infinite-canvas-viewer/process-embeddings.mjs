// get-user-docs-embeddings.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { cluster } from './cluster.js'
import fs from 'fs'
import { embeddingsToLatLng } from './pca.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUserDocsAndEmbeddings = async (username) => {
  // Connect to the database
  const db = await open({
    filename: path.resolve(__dirname, '../semantic-engine.sqlite'),
    driver: sqlite3.verbose().Database
  });

  try {
    console.log(`Fetching documents and embeddings for user: ${username}`);
    
    // More efficient approach: Join the tables to get all data in one query
    const results = await db.all(`
      SELECT 
        *
      FROM 
        docs d
      JOIN 
        chunks c ON d.id = c.docId
      WHERE 
        d.author = ?
    `, [username]);
    
    console.log(`Found ${results.length} results for user ${username}`);
    return results;
    
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  } finally {
    await db.close();
  }
};

// Example usage
const main = async () => {
  const username = 'DefenderOfBasic';
  
  try {
    const results = await getUserDocsAndEmbeddings(username);
    
    // Process or display results
    console.log(`Total results: ${results.length}`);
    
    // Output first result as sample (truncating embedding for readability)
    if (results.length > 0) {
      const sample = {...results[0]};
      if (sample.embedding) {
        sample.embedding = sample.embedding.substring(0, 50) + '... [truncated]';
      }
      console.log('Sample result:', JSON.stringify(sample, null, 2));

      const vectors = results.map(item => {
        return JSON.parse(item.embedding)
      })
      const pcaResults = embeddingsToLatLng(vectors)
      const geojson = {
        "type": "FeatureCollection",
        "features": []
      }

      for (let i = 0; i < pcaResults.length; i++) {
        geojson.features.push({
          "type": "Feature",
          "properties": {
            "text": results[i].content,
            "id": results[i].externalId
          },
          "geometry": {
            "coordinates": [
              pcaResults[i].lng, pcaResults[i].lat
            ],
            "type": "Point"
          }
        })
        
        // pcaResults[i].item = results[i] 
      }
      // console.log(pcaResults)
      // const clusterResults = cluster(results)
      fs.writeFileSync(`public/${username.toLowerCase()}-test.geojson`, JSON.stringify(geojson, null, 2));

    }
    
    // Further processing can be done here
    // For example, you might want to transform the embeddings or export to a file
    
  } catch (error) {
    console.error('Error in main execution:', error);
  }
};

// Execute the main function
main();